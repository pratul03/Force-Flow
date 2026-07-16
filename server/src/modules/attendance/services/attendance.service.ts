import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { QueueJob, TimeLogStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { QueueService } from '../../queue/services/queue.service';
import { AttendanceQueryDto } from '../dto/attendance-query.dto';
import { ClockInDto } from '../dto/clock-in.dto';
import { ClockOutDto } from '../dto/clock-out.dto';
import { UpdateTimeLogStatusDto } from '../dto/update-timelog-status.dto';
import { UpdateTimelogDto } from '../dto/update-timelog.dto';
import { StartBreakDto } from '../dto/start-break.dto';
import { EndBreakDto } from '../dto/end-break.dto';

@Injectable()
export class AttendanceService implements OnModuleInit {
  private readonly elevatedRoles = new Set<Role>([
    Role.SUPER_ADMIN,
    Role.ADMIN,
    Role.HR_MANAGER,
    Role.MANAGER,
  ]);

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

  async clockIn(dto: ClockInDto, actorOrganizationId: string) {
    await this.assertUserInOrganization(dto.userId, actorOrganizationId);

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
        clockInLatitude: dto.latitude,
        clockInLongitude: dto.longitude,
        clockInPhotoUrl: dto.photoUrl,
        status: TimeLogStatus.PENDING_APPROVAL,
      },
    });
  }

  async clockOut(dto: ClockOutDto, actorOrganizationId: string) {
    await this.assertUserInOrganization(dto.userId, actorOrganizationId);

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
        clockOutLatitude: dto.latitude,
        clockOutLongitude: dto.longitude,
        clockOutPhotoUrl: dto.photoUrl,
        totalHours,
        overtimeHours,
        earlyDepartureMinutes,
      },
    });
  }

  async getUserAttendance(
    userId: string,
    query: AttendanceQueryDto,
    actor: { sub: string; organizationId: string; role: string },
  ) {
    await this.assertUserAccess(userId, actor);

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

  async updateTimeLogStatus(
    timeLogId: string,
    dto: UpdateTimeLogStatusDto,
    actor: { sub: string; organizationId: string; role: string },
  ) {
    if (!this.elevatedRoles.has(actor.role as Role)) {
      throw new ForbiddenException('Only managers can update timelog status');
    }

    const timeLog = await this.prisma.timeLog.findUnique({
      where: { id: timeLogId },
      include: { user: true },
    });

    if (!timeLog) {
      throw new NotFoundException('TimeLog not found');
    }

    if (timeLog.user.organizationId !== actor.organizationId) {
      throw new ForbiddenException('You can only update timelogs for users in your organization');
    }

    return this.prisma.timeLog.update({
      where: { id: timeLogId },
      data: {
        status: dto.status,
        ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
      },
    });
  }

  async getDailySummary(
    userId: string,
    date: string | undefined,
    actor: { sub: string; organizationId: string; role: string },
  ) {
    await this.assertUserAccess(userId, actor);

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

  async adjustTimeLog(
    timeLogId: string,
    dto: UpdateTimelogDto,
    actor: { sub: string; organizationId: string; role: string },
  ) {
    if (!this.elevatedRoles.has(actor.role as Role)) {
      throw new ForbiddenException('Only managers can adjust timelogs');
    }

    const timeLog = await this.prisma.timeLog.findUnique({
      where: { id: timeLogId },
      include: { user: true },
    });

    if (!timeLog) {
      throw new NotFoundException('TimeLog not found');
    }

    if (timeLog.user.organizationId !== actor.organizationId) {
      throw new ForbiddenException('You can only update timelogs for users in your organization');
    }

    const updates: any = {};
    if (dto.notes !== undefined) updates.notes = dto.notes;
    
    const clockInAt = dto.clockIn ? new Date(dto.clockIn) : timeLog.clockIn;
    const clockOutAt = dto.clockOut ? new Date(dto.clockOut) : timeLog.clockOut;

    if (dto.clockIn !== undefined) updates.clockIn = clockInAt;
    if (dto.clockOut !== undefined) updates.clockOut = clockOutAt;

    // Recalculate hours if clockOut is present
    if (clockOutAt && (dto.clockIn !== undefined || dto.clockOut !== undefined)) {
      const workDate = clockInAt;
      const holiday = await this.findHolidayForUserOnDate(timeLog.userId, workDate);
      
      const breaks = await this.prisma.timeLogBreak.findMany({ where: { timeLogId } });
      let breakMs = 0;
      for (const b of breaks) {
        if (b.endTime) {
          breakMs += b.endTime.getTime() - b.startTime.getTime();
        }
      }

      const totalHours = Math.max(0, (clockOutAt.getTime() - clockInAt.getTime() - breakMs) / (1000 * 60 * 60));

      const shiftAssignment = timeLog.shiftAssignmentId
        ? await this.prisma.shiftAssignment.findUnique({
            where: { id: timeLog.shiftAssignmentId },
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

      const scheduledEnd = timeLog.scheduledEnd;
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

      updates.totalHours = totalHours;
      updates.overtimeHours = overtimeHours;
      updates.earlyDepartureMinutes = earlyDepartureMinutes;
    }

    return this.prisma.timeLog.update({
      where: { id: timeLogId },
      data: updates,
    });
  }

  async startBreak(userId: string, dto: StartBreakDto, actorOrganizationId: string) {
    await this.assertUserInOrganization(userId, actorOrganizationId);

    const openLog = await this.prisma.timeLog.findFirst({
      where: {
        userId,
        clockOut: null,
      },
      orderBy: { clockIn: 'desc' },
    });

    if (!openLog) {
      throw new BadRequestException('You must be clocked in to start a break');
    }

    const openBreak = await this.prisma.timeLogBreak.findFirst({
      where: {
        timeLogId: openLog.id,
        endTime: null,
      },
    });

    if (openBreak) {
      throw new BadRequestException('You are already on a break');
    }

    return this.prisma.timeLogBreak.create({
      data: {
        timeLogId: openLog.id,
        startTime: new Date(),
        reason: dto.reason,
      },
    });
  }

  async endBreak(userId: string, dto: EndBreakDto, actorOrganizationId: string) {
    await this.assertUserInOrganization(userId, actorOrganizationId);

    const openLog = await this.prisma.timeLog.findFirst({
      where: {
        userId,
        clockOut: null,
      },
      orderBy: { clockIn: 'desc' },
    });

    if (!openLog) {
      throw new BadRequestException('No active clock-in found');
    }

    const openBreak = await this.prisma.timeLogBreak.findFirst({
      where: {
        timeLogId: openLog.id,
        endTime: null,
      },
      orderBy: { startTime: 'desc' }
    });

    if (!openBreak) {
      throw new BadRequestException('You are not currently on a break');
    }

    return this.prisma.timeLogBreak.update({
      where: { id: openBreak.id },
      data: {
        endTime: new Date(),
        ...(dto.reason !== undefined ? { reason: dto.reason } : {}),
      },
    });
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

  private async assertUserInOrganization(userId: string, organizationId: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        organizationId,
      },
      select: {
        id: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found in your organization');
    }
  }

  private async assertUserAccess(
    targetUserId: string,
    actor: { sub: string; organizationId: string; role: string },
  ) {
    await this.assertUserInOrganization(targetUserId, actor.organizationId);

    if (targetUserId === actor.sub) {
      return;
    }

    if (!this.elevatedRoles.has(actor.role as Role)) {
      throw new ForbiddenException('You can only access your own attendance');
    }
  }
}
