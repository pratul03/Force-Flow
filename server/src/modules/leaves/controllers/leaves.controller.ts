import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { LeavesService } from '../services/leaves.service';
import { CreateLeaveDto } from '../dto/create-leave.dto';
import { LeaveApprovalDto } from '../dto/leave-approval.dto';
import { LeaveCancelDto } from '../dto/leave-cancel.dto';
import { LeaveRejectionDto } from '../dto/leave-rejection.dto';
import { LeavesQueryDto } from '../dto/leaves-query.dto';
import { UpdateLeaveDto } from '../dto/update-leave.dto';

@Controller('leaves')
export class LeavesController {
  constructor(private readonly leavesService: LeavesService) {}

  @Post()
  create(@Body() dto: CreateLeaveDto) {
    return this.leavesService.create(dto);
  }

  @Post('apply')
  apply(@Body() dto: CreateLeaveDto) {
    return this.leavesService.apply(dto);
  }

  @Get()
  findAll(@Query() query: LeavesQueryDto) {
    return this.leavesService.findAll(query);
  }

  @Get('pending')
  pending(@Query('approverId') approverId?: string) {
    return this.leavesService.pending(approverId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.leavesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateLeaveDto) {
    return this.leavesService.update(id, dto);
  }

  @Post(':id/approve')
  approve(@Param('id') id: string, @Body() dto: LeaveApprovalDto) {
    return this.leavesService.approve(id, dto);
  }

  @Post(':id/reject')
  reject(@Param('id') id: string, @Body() dto: LeaveRejectionDto) {
    return this.leavesService.reject(id, dto);
  }

  @Post(':id/cancel')
  cancel(@Param('id') id: string, @Body() dto: LeaveCancelDto) {
    return this.leavesService.cancel(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.leavesService.remove(id);
  }
}
