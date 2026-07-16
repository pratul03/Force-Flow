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
import { LeavesService } from '../services/leaves.service';
import { CreateLeaveDto } from '../dto/create-leave.dto';
import { LeaveApprovalDto } from '../dto/leave-approval.dto';
import { LeaveCancelDto } from '../dto/leave-cancel.dto';
import { LeaveRejectionDto } from '../dto/leave-rejection.dto';
import { LeavesQueryDto } from '../dto/leaves-query.dto';
import { UpdateLeaveDto } from '../dto/update-leave.dto';

@Controller('leaves')
@UseGuards(JwtAuthGuard)
export class LeavesController {
  constructor(private readonly leavesService: LeavesService) {}

  @Post()
  create(@Body() dto: CreateLeaveDto, @Req() req: { user: { sub: string; organizationId: string; role: string } }) {
    return this.leavesService.create(dto, req.user);
  }

  @Post('apply')
  apply(@Body() dto: CreateLeaveDto, @Req() req: { user: { sub: string; organizationId: string; role: string } }) {
    return this.leavesService.apply(dto, req.user);
  }

  @Get()
  findAll(
    @Query() query: LeavesQueryDto,
    @Req() req: { user: { sub: string; organizationId: string; role: string } },
  ) {
    return this.leavesService.findAll(query, req.user);
  }

  @Get('pending')
  pending(
    @Query('approverId') approverId: string | undefined,
    @Req() req: { user: { sub: string; organizationId: string; role: string } },
  ) {
    return this.leavesService.pending(approverId, req.user);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @Req() req: { user: { sub: string; organizationId: string; role: string } },
  ) {
    return this.leavesService.findOne(id, req.user);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateLeaveDto,
    @Req() req: { user: { sub: string; organizationId: string; role: string } },
  ) {
    return this.leavesService.update(id, dto, req.user);
  }

  @Post(':id/approve')
  approve(
    @Param('id') id: string,
    @Body() dto: LeaveApprovalDto,
    @Req() req: { user: { sub: string; organizationId: string; role: string } },
  ) {
    return this.leavesService.approve(
      id,
      {
        ...dto,
        actorUserId: req.user.sub,
      },
      req.user,
    );
  }

  @Post(':id/reject')
  reject(
    @Param('id') id: string,
    @Body() dto: LeaveRejectionDto,
    @Req() req: { user: { sub: string; organizationId: string; role: string } },
  ) {
    return this.leavesService.reject(
      id,
      {
        ...dto,
        actorUserId: req.user.sub,
      },
      req.user,
    );
  }

  @Post(':id/cancel')
  cancel(
    @Param('id') id: string,
    @Body() dto: LeaveCancelDto,
    @Req() req: { user: { sub: string; organizationId: string; role: string } },
  ) {
    return this.leavesService.cancel(
      id,
      {
        ...dto,
        actorUserId: req.user.sub,
      },
      req.user,
    );
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @Req() req: { user: { sub: string; organizationId: string; role: string } },
  ) {
    return this.leavesService.remove(id, req.user);
  }
}
