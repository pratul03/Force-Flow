import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../../common/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/auth/guards/roles.guard';
import { Roles } from '../../../common/auth/roles.decorator';
import { HolidaysService } from '../services/holidays.service';
import { CreateHolidayDto } from '../dto/create-holiday.dto';
import { HolidayQueryDto } from '../dto/holiday-query.dto';
import { SyncHolidaysDto } from '../dto/sync-holidays.dto';

@Controller('holidays')
export class HolidaysController {
  constructor(private readonly holidaysService: HolidaysService) {}

  @Get('status')
  status() {
    return this.holidaysService.getStatus();
  }

  @Get()
  list(@Query() query: HolidayQueryDto) {
    return this.holidaysService.list(query);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.HR_MANAGER)
  create(@Body() dto: CreateHolidayDto) {
    return this.holidaysService.create(dto);
  }

  @Post('sync')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.HR_MANAGER)
  sync(@Body() dto: SyncHolidaysDto) {
    return this.holidaysService.syncCalendar(dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.HR_MANAGER)
  remove(@Param('id') id: string) {
    return this.holidaysService.remove(id);
  }
}
