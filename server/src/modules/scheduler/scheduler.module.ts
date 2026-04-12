import { Module } from '@nestjs/common';
import { SchedulerController } from './controllers/scheduler.controller';
import { SchedulerService } from './services/scheduler.service';

@Module({
  controllers: [SchedulerController],
  providers: [SchedulerService],
  exports: [SchedulerService],
})
export class SchedulerModule {}
