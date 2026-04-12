import { Global, Module } from '@nestjs/common';
import { QueueController } from './controllers/queue.controller';
import { QueueService } from './services/queue.service';
import { QueueWorker } from './workers/queue.worker';

@Global()
@Module({
  controllers: [QueueController],
  providers: [QueueService, QueueWorker],
  exports: [QueueService],
})
export class QueueModule {}
