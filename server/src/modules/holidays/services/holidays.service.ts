import {
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { Prisma, QueueJob } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { QueueService } from '../../queue/services/queue.service';
import { CreateHolidayDto } from '../dto/create-holiday.dto';
import { HolidayQueryDto } from '../dto/holiday-query.dto';
import { SyncHolidaysDto } from '../dto/sync-holidays.dto';

@Injectable()
export class HolidaysService implements OnModuleInit {
  constructor(
    private readonly queueService: QueueService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit() {
    this.queueService.registerHandler('holidays.sync-calendar', async (job: QueueJob) => {
      await this.processSyncCalendar(job);
    });
  }

  async getStatus(organizationId: string) {
    const [holidays, upcomingCount] = await Promise.all([
      this.prisma.holiday.count({ where: { organizationId } }),
      this.prisma.holiday.count({
        where: {
          organizationId,
          date: {
            gte: new Date(),
          },
        },
      }),
    ]);

    return {
      module: 'holidays',
      status: 'active',
      organizationId,
      holidays,
      upcomingCount,
      generatedAt: new Date().toISOString(),
    };
  }

  list(query: HolidayQueryDto) {
    const where: Prisma.HolidayWhereInput = {
      ...(query.organizationId ? { organizationId: query.organizationId } : {}),
    };

    if (query.year) {
      const start = new Date(Date.UTC(query.year, 0, 1));
      const end = new Date(Date.UTC(query.year + 1, 0, 1));
      where.date = {
        gte: start,
        lt: end,
      };
    }

    return this.prisma.holiday.findMany({
      where,
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            country: true,
          },
        },
      },
      orderBy: { date: 'asc' },
      take: query.limit ?? 200,
    });
  }

  async create(dto: CreateHolidayDto) {
    const org = await this.prisma.organization.findUnique({
      where: { id: dto.organizationId },
      select: { id: true },
    });

    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    return this.prisma.holiday.create({
      data: {
        organizationId: dto.organizationId,
        name: dto.name,
        date: new Date(dto.date),
        country: dto.country,
        isOptional: dto.isOptional ?? false,
      },
    });
  }

  async remove(id: string, organizationId: string) {
    const existing = await this.prisma.holiday.findFirst({
      where: {
        id,
        organizationId,
      },
    });

    if (!existing) {
      throw new NotFoundException('Holiday not found');
    }

    await this.prisma.holiday.delete({ where: { id } });

    return { deleted: true, id };
  }

  async syncCalendar(dto: SyncHolidaysDto = {}) {
    const year = dto.year ?? new Date().getUTCFullYear();

    if (dto.organizationId) {
      const job = await this.queueService.enqueue({
        type: 'holidays.sync-calendar',
        payload: {
          organizationId: dto.organizationId,
          year,
          country: dto.country,
          trigger: 'manual',
        },
      });

      return { queued: 1, jobIds: [job.id] };
    }

    const organizations = await this.prisma.organization.findMany({
      select: { id: true, country: true },
    });

    const jobs = await Promise.all(
      organizations.map((org) =>
        this.queueService.enqueue({
          type: 'holidays.sync-calendar',
          payload: {
            organizationId: org.id,
            year,
            country: dto.country ?? org.country,
            trigger: 'manual',
          },
        }),
      ),
    );

    return { queued: jobs.length, jobIds: jobs.map((item) => item.id) };
  }

  private async processSyncCalendar(job: QueueJob) {
    const payload = job.payload as Prisma.JsonObject;
    const organizationId =
      typeof payload.organizationId === 'string' ? payload.organizationId : null;

    if (!organizationId) {
      return;
    }

    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { id: true, country: true },
    });

    if (!org) {
      throw new NotFoundException('Organization not found for holiday sync');
    }

    const year =
      typeof payload.year === 'number' && Number.isInteger(payload.year)
        ? payload.year
        : new Date().getUTCFullYear();
    const country =
      typeof payload.country === 'string' && payload.country.trim().length > 0
        ? payload.country.trim()
        : org.country;

    const seed = this.defaultHolidaySeed(year);

    await this.prisma.holiday.createMany({
      data: seed.map((item) => ({
        organizationId: org.id,
        name: item.name,
        date: new Date(`${year}-${item.mmdd}T00:00:00.000Z`),
        country,
        isOptional: item.optional,
      })),
      skipDuplicates: true,
    });
  }

  private defaultHolidaySeed(year: number) {
    return [
      { name: `New Year ${year}`, mmdd: '01-01', optional: false },
      { name: 'Republic Day', mmdd: '01-26', optional: false },
      { name: 'Labour Day', mmdd: '05-01', optional: false },
      { name: 'Independence Day', mmdd: '08-15', optional: false },
      { name: 'Gandhi Jayanti', mmdd: '10-02', optional: false },
      { name: 'Christmas Day', mmdd: '12-25', optional: false },
    ];
  }
}
