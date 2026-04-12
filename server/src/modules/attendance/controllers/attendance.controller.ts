import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { AttendanceQueryDto } from '../dto/attendance-query.dto';
import { AttendanceService } from '../services/attendance.service';
import { ClockInDto } from '../dto/clock-in.dto';
import { ClockOutDto } from '../dto/clock-out.dto';

@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('clock-in')
  clockIn(@Body() dto: ClockInDto) {
    return this.attendanceService.clockIn(dto);
  }

  @Post('clock-out')
  clockOut(@Body() dto: ClockOutDto) {
    return this.attendanceService.clockOut(dto);
  }

  @Get('user/:userId')
  getUserAttendance(
    @Param('userId') userId: string,
    @Query() query: AttendanceQueryDto,
  ) {
    return this.attendanceService.getUserAttendance(userId, query);
  }

  @Get('user/:userId/daily-summary')
  getDailySummary(@Param('userId') userId: string, @Query('date') date?: string) {
    return this.attendanceService.getDailySummary(userId, date);
  }
}
