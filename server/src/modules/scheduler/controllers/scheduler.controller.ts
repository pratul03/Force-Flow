import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../../common/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/auth/guards/roles.guard';
import { Roles } from '../../../common/auth/roles.decorator';
import { SchedulerService } from '../services/scheduler.service';
import { ScheduleJobDto } from '../dto/schedule-job.dto';
import { RunPayrollCycleDto } from '../dto/run-payroll-cycle.dto';

@Controller('scheduler')
export class SchedulerController {
  constructor(private readonly schedulerService: SchedulerService) {}

  @Post('nightly')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  runNightly() {
    return this.schedulerService.runNightly();
  }

  @Post('payroll')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.HR_MANAGER)
  runPayroll(@Body() dto: RunPayrollCycleDto) {
    return this.schedulerService.runPayrollCycle(dto);
  }

  @Post('jobs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  schedule(@Body() dto: ScheduleJobDto) {
    return this.schedulerService.schedule(dto);
  }
}
