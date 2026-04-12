import {
  Body,
  Controller,
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
import { CompensationService } from '../services/compensation.service';
import { CompensationPreviewDto } from '../dto/compensation-preview.dto';
import { CompensationSettlementQueryDto } from '../dto/compensation-settlement-query.dto';
import { RecalculateCompensationDto } from '../dto/recalculate-compensation.dto';

@Controller('compensation')
export class CompensationController {
  constructor(private readonly compensationService: CompensationService) {}

  @Get('status')
  status() {
    return this.compensationService.getStatus();
  }

  @Get('preview/:userId')
  preview(
    @Param('userId') userId: string,
    @Query() query: CompensationPreviewDto,
  ) {
    return this.compensationService.previewUserCompensation(userId, query);
  }

  @Get('settlements')
  listSettlements(@Query() query: CompensationSettlementQueryDto) {
    return this.compensationService.listSettlements(query);
  }

  @Post('recalculate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.HR_MANAGER)
  recalculate(@Body() dto: RecalculateCompensationDto) {
    return this.compensationService.recalculate(dto);
  }
}
