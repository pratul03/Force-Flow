import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
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
@UseGuards(JwtAuthGuard)
export class HolidaysController {
  constructor(private readonly holidaysService: HolidaysService) {}

  @Get('status')
  status(@Req() req: { user: { organizationId: string } }) {
    return this.holidaysService.getStatus(req.user.organizationId);
  }

  @Get()
  list(@Query() query: HolidayQueryDto, @Req() req: { user: { organizationId: string } }) {
    return this.holidaysService.list({
      ...query,
      organizationId: req.user.organizationId,
    });
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.HR_MANAGER)
  create(@Body() dto: CreateHolidayDto, @Req() req: { user: { organizationId: string } }) {
    return this.holidaysService.create({
      ...dto,
      organizationId: req.user.organizationId,
    });
  }

  @Post('sync')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.HR_MANAGER)
  sync(@Body() dto: SyncHolidaysDto, @Req() req: { user: { organizationId: string } }) {
    return this.holidaysService.syncCalendar({
      ...dto,
      organizationId: req.user.organizationId,
    });
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.HR_MANAGER)
  remove(@Param('id') id: string, @Req() req: { user: { organizationId: string } }) {
    return this.holidaysService.remove(id, req.user.organizationId);
  }
}
