import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AttendanceQueryDto } from '../dto/attendance-query.dto';
import { AttendanceService } from '../services/attendance.service';
import { ClockInDto } from '../dto/clock-in.dto';
import { ClockOutDto } from '../dto/clock-out.dto';
import { UpdateTimeLogStatusDto } from '../dto/update-timelog-status.dto';
import { UpdateTimelogDto } from '../dto/update-timelog.dto';
import { StartBreakDto } from '../dto/start-break.dto';
import { EndBreakDto } from '../dto/end-break.dto';
import { JwtAuthGuard } from '../../../common/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/auth/guards/roles.guard';
import { Roles } from '../../../common/auth/roles.decorator';
import { Role } from '@prisma/client';

type AuthenticatedRequest = {
  user: {
    sub: string;
    organizationId: string;
    role: string;
  };
};

@Controller('attendance')
@UseGuards(JwtAuthGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('clock-in')
  clockIn(@Body() dto: ClockInDto, @Req() req: AuthenticatedRequest) {
    return this.attendanceService.clockIn(
      {
        ...dto,
        userId: req.user.sub,
      },
      req.user.organizationId,
    );
  }

  @Post('clock-out')
  clockOut(@Body() dto: ClockOutDto, @Req() req: AuthenticatedRequest) {
    return this.attendanceService.clockOut(
      {
        ...dto,
        userId: req.user.sub,
      },
      req.user.organizationId,
    );
  }

  @Get('user/:userId')
  getUserAttendance(
    @Param('userId') userId: string,
    @Query() query: AttendanceQueryDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.attendanceService.getUserAttendance(userId, query, req.user);
  }

  @Get('organization')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.HR_MANAGER, Role.MANAGER)
  getOrganizationAttendance(
    @Query() query: AttendanceQueryDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.attendanceService.getOrganizationAttendance(
      req.user.organizationId,
      query,
      req.user,
    );
  }

  @Patch('timelogs/:timeLogId/status')
  updateTimeLogStatus(
    @Param('timeLogId') timeLogId: string,
    @Body() dto: UpdateTimeLogStatusDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.attendanceService.updateTimeLogStatus(timeLogId, dto, req.user);
  }

  @Get('user/:userId/daily-summary')
  getDailySummary(
    @Param('userId') userId: string,
    @Query('date') date: string | undefined,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.attendanceService.getDailySummary(userId, date, req.user);
  }

  @Patch('timelogs/:timeLogId/adjust')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  adjustTimeLog(
    @Param('timeLogId') timeLogId: string,
    @Body() dto: UpdateTimelogDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.attendanceService.adjustTimeLog(timeLogId, dto, req.user);
  }

  @Post('start-break')
  startBreak(@Body() dto: StartBreakDto, @Req() req: AuthenticatedRequest) {
    return this.attendanceService.startBreak(req.user.sub, dto, req.user.organizationId);
  }

  @Post('end-break')
  endBreak(@Body() dto: EndBreakDto, @Req() req: AuthenticatedRequest) {
    return this.attendanceService.endBreak(req.user.sub, dto, req.user.organizationId);
  }
}
