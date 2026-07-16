import {
  Body,
  Controller,
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
import { CompensationService } from '../services/compensation.service';
import { CompensationPreviewDto } from '../dto/compensation-preview.dto';
import { CompensationSettlementQueryDto } from '../dto/compensation-settlement-query.dto';
import { RecalculateCompensationDto } from '../dto/recalculate-compensation.dto';

@Controller('compensation')
@UseGuards(JwtAuthGuard)
export class CompensationController {
  constructor(private readonly compensationService: CompensationService) {}

  @Get('status')
  status(@Req() req: { user: { organizationId: string } }) {
    return this.compensationService.getStatus(req.user.organizationId);
  }

  @Get('preview/:userId')
  preview(
    @Param('userId') userId: string,
    @Query() query: CompensationPreviewDto,
    @Req() req: { user: { sub: string; organizationId: string; role: Role } },
  ) {
    return this.compensationService.previewUserCompensation(userId, query, {
      actorUserId: req.user.sub,
      organizationId: req.user.organizationId,
      role: req.user.role,
    });
  }

  @Get('settlements')
  listSettlements(
    @Query() query: CompensationSettlementQueryDto,
    @Req() req: { user: { sub: string; organizationId: string; role: Role } },
  ) {
    return this.compensationService.listSettlements(query, {
      actorUserId: req.user.sub,
      organizationId: req.user.organizationId,
      role: req.user.role,
    });
  }

  @Post('recalculate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.HR_MANAGER)
  recalculate(
    @Body() dto: RecalculateCompensationDto,
    @Req() req: { user: { organizationId: string } },
  ) {
    return this.compensationService.recalculate({
      ...dto,
      organizationId: req.user.organizationId,
    });
  }
}
