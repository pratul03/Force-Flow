import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { QueueJob, TimeLogStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { QueueService } from '../../queue/services/queue.service';
import { AttendanceQueryDto } from '../dto/attendance-query.dto';
import { ClockInDto } from '../dto/clock-in.dto';
import { ClockOutDto } from '../dto/clock-out.dto';

@Injectable()
export class AttendanceService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queueService: QueueService,
  ) {}

  onModuleInit() {
    this.queueService.registerHandler(
      'attendance.calculate-daily',
      async (job: QueueJob) => {
        const payload = job.payload as { date?: string };
        await this.calculateDailyMetrics(payload.date);
      },
    );
  }

  async clockIn(dto: ClockInDto) {
    const existingOpenLog = await this.prisma.timeLog.findFirst({
      where: {
        userId: dto.userId,
        clockOut: null,
      },
    });

    if (existingOpenLog) {
      throw new BadRequestException('User already has an active clock-in');
    }

    const clockInAt = new Date(dto.clockIn);
    const assignment = await this.getActiveShiftAssignment(dto.userId, clockInAt);

    const { scheduledStart, scheduledEnd, lateByMinutes } =
      assignment && assignment.shift
        ? this.calculateShiftScheduleAndLateness(clockInAt, assignment.shift)
        : { scheduledStart: null, scheduledEnd: null, lateByMinutes: 0 };

    return this.prisma.timeLog.create({
      data: {
        userId: dto.userId,
        shiftAssignmentId: assignment?.id,
        clockIn: clockInAt,
        scheduledStart,
        scheduledEnd,
        lateByMinutes,
        status: TimeLogStatus.PENDING_APPROVAL,
      },
    });
  }

  async clockOut(dto: ClockOutDto) {
    const openLog = await this.prisma.timeLog.findFirst({
      where: {
        userId: dto.userId,
        clockOut: null,
      },
      orderBy: { clockIn: 'desc' },
    });

    if (!openLog) {
      throw new NotFoundException('No active clock-in found for user');
    }

    const clockOutAt = dto.clockOut ? new Date(dto.clockOut) : new Date();
    const workDate = new Date(openLog.clockIn);
    const holiday = await this.findHolidayForUserOnDate(dto.userId, workDate);
    const totalHours =
      (clockOutAt.getTime() - new Date(openLog.clockIn).getTime()) / (1000 * 60 * 60);

    const shiftAssignment = openLog.shiftAssignmentId
      ? await this.prisma.shiftAssignment.findUnique({
          where: { id: openLog.shiftAssignmentId },
          include: { shift: true },
        })
      : null;

    const standardHours = shiftAssignment?.shift
      ? this.calculateStandardHours(
          shiftAssignment.shift.startTime,
          shiftAssignment.shift.endTime,
          shiftAssignment.shift.breakDurationMinutes,
        )
      : 8;

    const scheduledEnd = openLog.scheduledEnd;
    const earlyDepartureMinutes = holiday
      ? 0
      : scheduledEnd
        ? Math.max(
            0,
            Math.floor((scheduledEnd.getTime() - clockOutAt.getTime()) / (1000 * 60)),
          )
        : 0;

    const overtimeHours = holiday
      ? Math.max(0, totalHours)
      : Math.max(0, totalHours - standardHours);

    return this.prisma.timeLog.update({
      where: { id: openLog.id },
      data: {
        clockOut: clockOutAt,
        totalHours,
        overtimeHours,
        earlyDepartureMinutes,
      },
    });
  }

  getUserAttendance(userId: string, query: AttendanceQueryDto) {
    const fromDate = query.fromDate ? new Date(query.fromDate) : undefined;
    const toDate = query.toDate ? new Date(query.toDate) : undefined;

    return this.prisma.timeLog.findMany({
      where: {
        userId,
        ...(fromDate || toDate
          ? {
              clockIn: {
                gte: fromDate,
                lte: toDate,
              },
            }
          : {}),
      },
      orderBy: { clockIn: 'desc' },
      take: query.limit ?? 100,
    });
  }

  async getDailySummary(userId: string, date?: string) {
    const target = date ? new Date(date) : new Date();
    const { start, end } = this.getDayBounds(target);
    const holiday = await this.findHolidayForUserOnDate(userId, start);

    const logs = await this.prisma.timeLog.findMany({
      where: {
        userId,
        clockIn: {
          gte: start,
          lt: end,
        },
      },
      orderBy: { clockIn: 'asc' },
    });

    const workedHours = logs.reduce((acc, item) => acc + (item.totalHours ?? 0), 0);
    const loggedOvertimeHours = logs.reduce((acc, item) => acc + (item.overtimeHours ?? 0), 0);
    const overtimeHours = holiday ? workedHours : loggedOvertimeHours;
    const regularHours = Math.max(0, workedHours - overtimeHours);
    const lateByMinutes = logs.reduce((acc, item) => acc + item.lateByMinutes, 0);

    return {
      userId,
      date: start.toISOString().slice(0, 10),
      isHoliday: Boolean(holiday),
      holidayName: holiday?.name ?? null,
      logsCount: logs.length,
      workedHours,
      regularHours,
      overtimeHours,
      lateByMinutes,
    };
  }

  private async calculateDailyMetrics(date?: string) {
    const target = date ? new Date(date) : new Date();
    const { start, end } = this.getDayBounds(target);

    const [logs, holidays] = await Promise.all([
      this.prisma.timeLog.findMany({
        where: {
          clockIn: {
            gte: start,
            lt: end,
          },
        },
        include: {
          user: {
            select: {
              organizationId: true,
            },
          },
        },
      }),
      this.prisma.holiday.findMany({
        where: {
          date: {
            gte: start,
            lt: end,
          },
        },
        select: {
          organizationId: true,
          name: true,
        },
      }),
    ]);

    const holidayByOrg = new Map(holidays.map((item) => [item.organizationId, item.name]));
    const dailyByUser = new Map<
      string,
      {
        workedHours: number;
        loggedOvertimeHours: number;
        logsCount: number;
        isHoliday: boolean;
        holidayName: string | null;
      }
    >();

    for (const log of logs) {
      const current = dailyByUser.get(log.userId) ?? {
        workedHours: 0,
        loggedOvertimeHours: 0,
        logsCount: 0,
        isHoliday: false,
        holidayName: null,
      };

      const orgHolidayName = holidayByOrg.get(log.user.organizationId) ?? null;

      current.workedHours += log.totalHours ?? 0;
      current.loggedOvertimeHours += log.overtimeHours ?? 0;
      current.logsCount += 1;
      if (orgHolidayName) {
        current.isHoliday = true;
        current.holidayName = orgHolidayName;
      }

      dailyByUser.set(log.userId, current);
    }

    return Array.from(dailyByUser.entries()).map(([userId, item]) => {
      const overtimeHours = item.isHoliday
        ? item.workedHours
        : item.loggedOvertimeHours;
      const regularHours = Math.max(0, item.workedHours - overtimeHours);

      return {
        userId,
        date: start.toISOString().slice(0, 10),
        logsCount: item.logsCount,
        isHoliday: item.isHoliday,
        holidayName: item.holidayName,
        workedHours: item.workedHours,
        regularHours,
        overtimeHours,
      };
    });
  }

  private async findHolidayForUserOnDate(userId: string, date: Date) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true },
    });

    if (!user) {
      return null;
    }

    const { start, end } = this.getDayBounds(date);

    return this.prisma.holiday.findFirst({
      where: {
        organizationId: user.organizationId,
        date: {
          gte: start,
          lt: end,
        },
      },
      orderBy: { date: 'asc' },
      select: {
        id: true,
        name: true,
      },
    });
  }

  private getDayBounds(target: Date) {
    const start = new Date(
      Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), target.getUTCDate()),
    );
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);

    return { start, end };
  }

  private async getActiveShiftAssignment(userId: string, now: Date) {
    return this.prisma.shiftAssignment.findFirst({
      where: {
        userId,
        isActive: true,
        effectiveFrom: { lte: now },
        OR: [{ effectiveUntil: null }, { effectiveUntil: { gte: now } }],
      },
      include: { shift: true },
      orderBy: { effectiveFrom: 'desc' },
    });
  }

  private calculateShiftScheduleAndLateness(
    clockInAt: Date,
    shift: { startTime: string; endTime: string; graceTimeMinutes: number },
  ) {
    const scheduledStart = this.combineDateAndTime(clockInAt, shift.startTime);
    let scheduledEnd = this.combineDateAndTime(clockInAt, shift.endTime);

    if (scheduledEnd.getTime() <= scheduledStart.getTime()) {
      scheduledEnd.setUTCDate(scheduledEnd.getUTCDate() + 1);
    }

    const lateRaw = Math.floor((clockInAt.getTime() - scheduledStart.getTime()) / (1000 * 60));
    const lateByMinutes = Math.max(0, lateRaw - shift.graceTimeMinutes);

    return { scheduledStart, scheduledEnd, lateByMinutes };
  }

  private calculateStandardHours(startTime: string, endTime: string, breakMinutes: number) {
    const ref = new Date();
    const start = this.combineDateAndTime(ref, startTime);
    const end = this.combineDateAndTime(ref, endTime);

    if (end.getTime() <= start.getTime()) {
      end.setUTCDate(end.getUTCDate() + 1);
    }

    const totalMinutes = Math.floor((end.getTime() - start.getTime()) / (1000 * 60));
    return Math.max(0, (totalMinutes - breakMinutes) / 60);
  }

  private combineDateAndTime(baseDate: Date, hhmm: string) {
    const [hh, mm] = hhmm.split(':').map((part) => Number(part));
    const date = new Date(baseDate);
    date.setUTCHours(hh || 0, mm || 0, 0, 0);
    return date;
  }
}
