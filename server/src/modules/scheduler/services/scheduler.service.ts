import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { QueueService } from '../../queue/services/queue.service';
import { ScheduleJobDto } from '../dto/schedule-job.dto';
import { RunPayrollCycleDto } from '../dto/run-payroll-cycle.dto';

@Injectable()
export class SchedulerService {
  private readonly logger = new Logger(SchedulerService.name);

  constructor(private readonly queueService: QueueService) {}

  async runNightly(trigger = 'manual') {
    const date = new Date();
    const dateIso = date.toISOString().slice(0, 10);
    const [attendanceJob, currencyJob] = await Promise.all([
      this.queueService.enqueue({
        type: 'attendance.calculate-daily',
        payload: { trigger, date: dateIso },
      }),
      this.queueService.enqueue({
        type: 'currency.sync-rates',
        payload: { source: 'scheduler-nightly', trigger },
      }),
    ]);

    return {
      trigger,
      date: dateIso,
      queued: [
        { id: attendanceJob.id, type: attendanceJob.type },
        { id: currencyJob.id, type: currencyJob.type },
      ],
    };
  }

  async runPayrollCycle(dto: RunPayrollCycleDto = {}, trigger = 'manual') {
    const cycle = this.resolvePayrollCycle(dto.month, dto.year);
    const job = await this.queueService.enqueue({
      type: 'payroll.generate-cycle',
      payload: {
        trigger,
        month: cycle.month,
        year: cycle.year,
        organizationId: dto.organizationId,
      },
      maxAttempts: 5,
    });

    return {
      trigger,
      cycle,
      queueJobId: job.id,
      type: job.type,
    };
  }

  schedule(dto: ScheduleJobDto) {
    return this.queueService.enqueue({
      type: dto.type,
      payload: dto.payload ?? {},
    });
  }

  @Cron('5 0 * * *')
  async runNightlyCron() {
    try {
      await this.runNightly('cron-nightly');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown scheduler error';
      this.logger.error(`Nightly scheduler failed: ${message}`);
    }
  }

  @Cron('15 0 1 * *')
  async runMonthlyPayrollCron() {
    try {
      await this.runPayrollCycle({}, 'cron-monthly-payroll');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown scheduler error';
      this.logger.error(`Monthly payroll scheduler failed: ${message}`);
    }
  }

  private resolvePayrollCycle(month?: number, year?: number) {
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
