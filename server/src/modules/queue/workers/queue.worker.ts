import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QueueService } from '../services/queue.service';

@Injectable()
export class QueueWorker implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QueueWorker.name);
  private readonly workerId = `worker-${process.pid}`;
  private timer: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor(
    private readonly queueService: QueueService,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit() {
    const isDisabled =
      String(this.configService.get('QUEUE_WORKER_DISABLED') ?? 'false').toLowerCase() ===
      'true';

    if (isDisabled) {
      this.logger.log('In-house queue worker disabled by configuration');
      return;
    }

    const pollMs = Number(this.configService.get('QUEUE_POLL_INTERVAL_MS') ?? 5000);
    const batchSize = Number(this.configService.get('QUEUE_BATCH_SIZE') ?? 10);

    this.timer = setInterval(() => {
      void this.tick(batchSize);
    }, pollMs);

    this.logger.log(`In-house queue worker started: interval=${pollMs}ms batch=${batchSize}`);
  }

  onModuleDestroy() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private async tick(batchSize: number) {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;
    try {
      await this.queueService.processDueJobs(this.workerId, batchSize);
    } finally {
      this.isRunning = false;
    }
  }
}
