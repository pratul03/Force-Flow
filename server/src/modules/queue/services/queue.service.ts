import { Injectable, Logger } from '@nestjs/common';
import { Prisma, QueueJob, QueueJobStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateQueueJobDto } from '../dto/create-queue-job.dto';

type QueueHandler = (job: QueueJob) => Promise<void>;

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);
  private readonly handlers = new Map<string, QueueHandler>();

  constructor(private readonly prisma: PrismaService) {}

  registerHandler(type: string, handler: QueueHandler) {
    this.handlers.set(type, handler);
  }

  enqueue(dto: CreateQueueJobDto) {
    return this.prisma.queueJob.create({
      data: {
        type: dto.type,
        payload: dto.payload as Prisma.InputJsonValue,
        maxAttempts: dto.maxAttempts ?? 3,
        availableAt: dto.availableAt ? new Date(dto.availableAt) : new Date(),
      },
    });
  }

  listJobs(limit = 50, status?: QueueJobStatus) {
    return this.prisma.queueJob.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async processDueJobs(workerId: string, batchSize = 10) {
    const now = new Date();
    const candidates = await this.prisma.queueJob.findMany({
      where: {
        status: { in: [QueueJobStatus.PENDING, QueueJobStatus.RETRY] },
        availableAt: { lte: now },
      },
      orderBy: { availableAt: 'asc' },
      take: batchSize,
    });

    let processed = 0;

    for (const candidate of candidates) {
      const lock = await this.prisma.queueJob.updateMany({
        where: {
          id: candidate.id,
          status: { in: [QueueJobStatus.PENDING, QueueJobStatus.RETRY] },
        },
        data: {
          status: QueueJobStatus.PROCESSING,
          lockedAt: new Date(),
          lockedBy: workerId,
          attempts: { increment: 1 },
        },
      });

      if (lock.count === 0) {
        continue;
      }

      const job = await this.prisma.queueJob.findUnique({
        where: { id: candidate.id },
      });

      if (!job) {
        continue;
      }

      await this.executeJob(job);
      processed += 1;
    }

    return { processed };
  }

  private async executeJob(job: QueueJob) {
    const handler = this.handlers.get(job.type);

    if (!handler) {
      await this.failJob(job, `No handler registered for job type: ${job.type}`);
      return;
    }

    try {
      await handler(job);

      await this.prisma.queueJob.update({
        where: { id: job.id },
        data: {
          status: QueueJobStatus.COMPLETED,
          processedAt: new Date(),
          lockedAt: null,
          lockedBy: null,
          lastError: null,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown queue error';
      await this.failJob(job, message);
      this.logger.error(`Queue job failed: ${job.id} (${job.type}) - ${message}`);
    }
  }

  private async failJob(job: QueueJob, message: string) {
    const shouldRetry = job.attempts < job.maxAttempts;
    const retrySeconds = Math.min(300, Math.pow(2, job.attempts) * 5);
    const nextAvailableAt = new Date(Date.now() + retrySeconds * 1000);

    await this.prisma.queueJob.update({
      where: { id: job.id },
      data: {
        status: shouldRetry ? QueueJobStatus.RETRY : QueueJobStatus.FAILED,
        availableAt: shouldRetry ? nextAvailableAt : job.availableAt,
        lastError: message,
        lockedAt: null,
        lockedBy: null,
      },
    });
  }
}
