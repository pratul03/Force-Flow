import {
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import {
  PerformanceReviewStatus,
  Prisma,
  QueueJob,
  QueueJobStatus,
  UserStatus,
} from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { QueueService } from '../../queue/services/queue.service';
import { GenerateReviewCycleDto } from '../dto/generate-review-cycle.dto';
import { PerformanceReviewQueryDto } from '../dto/performance-review-query.dto';
import { UpsertPerformanceReviewDto } from '../dto/upsert-performance-review.dto';

@Injectable()
export class PerformanceService implements OnModuleInit {
  constructor(
    private readonly queueService: QueueService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit() {
    this.queueService.registerHandler('performance.generate-review-cycle', async (job: QueueJob) => {
      await this.processReviewCycle(job);
    });
  }

  async getStatus(organizationId?: string) {
    const where = organizationId ? { organizationId } : undefined;

    const [reviewsCount, stageCounts, queuedJobs] = await Promise.all([
      this.prisma.performanceReview.count({ where }),
      this.prisma.performanceReview.groupBy({
        by: ['status'],
        where,
        _count: { _all: true },
      }),
      this.prisma.queueJob.count({
        where: {
          type: 'performance.generate-review-cycle',
          status: {
            in: [
              QueueJobStatus.PENDING,
              QueueJobStatus.RETRY,
              QueueJobStatus.PROCESSING,
            ],
          },
        },
      }),
    ]);

    return {
      module: 'performance',
      status: 'active',
      organizationId: organizationId ?? null,
      reviewsCount,
      reviewStatuses: stageCounts.map((item) => ({
        status: item.status,
        count: item._count._all,
      })),
      queuedJobs,
      generatedAt: new Date().toISOString(),
    };
  }

  listReviews(query: PerformanceReviewQueryDto) {
    return this.prisma.performanceReview.findMany({
      where: {
        ...(query.organizationId ? { organizationId: query.organizationId } : {}),
        ...(query.userId ? { userId: query.userId } : {}),
        ...(query.month ? { cycleMonth: query.month } : {}),
        ...(query.year ? { cycleYear: query.year } : {}),
        ...(query.status ? { status: query.status } : {}),
      },
      orderBy: [{ cycleYear: 'desc' }, { cycleMonth: 'desc' }, { createdAt: 'desc' }],
      take: query.limit ?? 100,
    });
  }

  async upsertReview(dto: UpsertPerformanceReviewDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
      select: { id: true, organizationId: true },
    });

    if (!user || user.organizationId !== dto.organizationId) {
      throw new NotFoundException('User not found in the organization');
    }

    return this.prisma.performanceReview.upsert({
      where: {
        organizationId_userId_cycleMonth_cycleYear: {
          organizationId: dto.organizationId,
          userId: dto.userId,
          cycleMonth: dto.cycleMonth,
          cycleYear: dto.cycleYear,
        },
      },
      create: {
        organizationId: dto.organizationId,
        userId: dto.userId,
        reviewerId: dto.reviewerId,
        cycleMonth: dto.cycleMonth,
        cycleYear: dto.cycleYear,
        score: dto.score,
        status: dto.status ?? PerformanceReviewStatus.DRAFT,
        summary: dto.summary,
        strengths: dto.strengths,
        improvements: dto.improvements,
        goals: dto.goals as Prisma.InputJsonValue,
      },
      update: {
        reviewerId: dto.reviewerId,
        score: dto.score,
        status: dto.status,
        summary: dto.summary,
        strengths: dto.strengths,
        improvements: dto.improvements,
        goals: dto.goals as Prisma.InputJsonValue,
      },
    });
  }

  generateReviewCycle(dto: GenerateReviewCycleDto = {}) {
    return this.queueService.enqueue({
      type: 'performance.generate-review-cycle',
      payload: {
        ...dto,
        requestedAt: new Date().toISOString(),
      },
      maxAttempts: 5,
    });
  }

  private async processReviewCycle(job: QueueJob) {
    const payload = job.payload as Prisma.JsonObject;
    const { month, year } = this.resolveCycle(payload.month, payload.year);
    const organizationId =
      typeof payload.organizationId === 'string' ? payload.organizationId : null;

    const users = await this.prisma.user.findMany({
      where: {
        status: UserStatus.ACTIVE,
        ...(organizationId ? { organizationId } : {}),
      },
      select: {
        id: true,
        organizationId: true,
      },
    });

    const createdOrUpdated = await Promise.all(
      users.map((user) =>
        this.prisma.performanceReview.upsert({
          where: {
            organizationId_userId_cycleMonth_cycleYear: {
              organizationId: user.organizationId,
              userId: user.id,
              cycleMonth: month,
              cycleYear: year,
            },
          },
          create: {
            organizationId: user.organizationId,
            userId: user.id,
            cycleMonth: month,
            cycleYear: year,
            status: PerformanceReviewStatus.DRAFT,
            generatedByJob: job.id,
          },
          update: {
            generatedByJob: job.id,
          },
          select: { id: true },
        }),
      ),
    );

    await this.queueService.enqueue({
      type: 'notification.send',
      payload: {
        channel: 'email',
        title: 'Performance review cycle generated',
        message: `Generated ${createdOrUpdated.length} performance reviews for ${month}/${year}.`,
        locale: 'en',
        metadata: {
          month,
          year,
          reviews: createdOrUpdated.length,
          organizationId,
        },
      },
      maxAttempts: 3,
    });
  }

  private resolveCycle(monthValue: unknown, yearValue: unknown) {
    const month = typeof monthValue === 'number' && Number.isInteger(monthValue) ? monthValue : null;
    const year = typeof yearValue === 'number' && Number.isInteger(yearValue) ? yearValue : null;

    if (month && year) {
      return { month, year };
    }

    const now = new Date();
    const currentMonth = now.getUTCMonth() + 1;

    if (currentMonth === 1) {
      return { month: 12, year: now.getUTCFullYear() - 1 };
    }

    return { month: currentMonth - 1, year: now.getUTCFullYear() };
  }
}
