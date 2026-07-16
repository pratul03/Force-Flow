import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../../common/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/auth/guards/roles.guard';
import { Roles } from '../../../common/auth/roles.decorator';
import { SchedulerService } from '../services/scheduler.service';
import { ScheduleJobDto } from '../dto/schedule-job.dto';
import { RunPayrollCycleDto } from '../dto/run-payroll-cycle.dto';

type AuthenticatedRequest = {
  user: {
    role: Role;
    organizationId: string;
  };
};

@Controller('scheduler')
export class SchedulerController {
  constructor(private readonly schedulerService: SchedulerService) {}

  @Post('nightly')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  runNightly() {
    return this.schedulerService.runNightly();
  }

  @Post('payroll')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.HR_MANAGER)
  runPayroll(
    @Body() dto: RunPayrollCycleDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const isSuperAdmin = req.user.role === Role.SUPER_ADMIN;

    return this.schedulerService.runPayrollCycle({
      ...dto,
      organizationId: isSuperAdmin
        ? (dto.organizationId ?? req.user.organizationId)
        : req.user.organizationId,
    });
  }

  @Post('jobs')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  schedule(@Body() dto: ScheduleJobDto) {
    return this.schedulerService.schedule(dto);
  }
}
