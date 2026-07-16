import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/auth/guards/jwt-auth.guard';
import { AssignShiftDto } from '../dto/assign-shift.dto';
import { CreateShiftDto } from '../dto/create-shift.dto';
import { UpdateShiftDto } from '../dto/update-shift.dto';
import { ShiftsService } from '../services/shifts.service';

@Controller('shifts')
@UseGuards(JwtAuthGuard)
export class ShiftsController {
  constructor(private readonly shiftsService: ShiftsService) {}

  @Post()
  create(@Body() dto: CreateShiftDto, @Req() req: { user: { organizationId: string } }) {
    return this.shiftsService.create(dto, req.user.organizationId);
  }

  @Get()
  findAll(@Req() req: { user: { organizationId: string } }) {
    return this.shiftsService.findAll(req.user.organizationId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: { user: { organizationId: string } }) {
    return this.shiftsService.findOne(id, req.user.organizationId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateShiftDto,
    @Req() req: { user: { organizationId: string } },
  ) {
    return this.shiftsService.update(id, dto, req.user.organizationId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: { user: { organizationId: string } }) {
    return this.shiftsService.remove(id, req.user.organizationId);
  }

  @Post('assignments')
  assign(@Body() dto: AssignShiftDto, @Req() req: { user: { organizationId: string } }) {
    return this.shiftsService.assignToUser(dto, req.user.organizationId);
  }

  @Get('assignments/list')
  assignments(
    @Query('userId') userId: string | undefined,
    @Req() req: { user: { organizationId: string } },
  ) {
    return this.shiftsService.listAssignments(userId, req.user.organizationId);
  }
}
