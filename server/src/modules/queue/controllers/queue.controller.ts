import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { QueueService } from '../services/queue.service';
import { CreateQueueJobDto } from '../dto/create-queue-job.dto';
import { QueueJobsQueryDto } from '../dto/queue-jobs-query.dto';

@Controller('queue/jobs')
export class QueueController {
  constructor(private readonly queueService: QueueService) {}

  @Post()
  enqueue(@Body() dto: CreateQueueJobDto) {
    return this.queueService.enqueue(dto);
  }

  @Get()
  list(@Query() query: QueueJobsQueryDto) {
    return this.queueService.listJobs(query.limit ?? 50, query.status);
  }

  @Post('process')
  processNow() {
    return this.queueService.processDueJobs('manual-trigger', 25);
  }
}
