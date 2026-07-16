import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../../common/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/auth/guards/roles.guard';
import { Roles } from '../../../common/auth/roles.decorator';
import { PerformanceService } from '../services/performance.service';
import { GenerateReviewCycleDto } from '../dto/generate-review-cycle.dto';
import { PerformanceReviewQueryDto } from '../dto/performance-review-query.dto';
import { UpsertPerformanceReviewDto } from '../dto/upsert-performance-review.dto';

@Controller('performance')
@UseGuards(JwtAuthGuard)
export class PerformanceController {
  constructor(private readonly performanceService: PerformanceService) {}

  @Get('status')
  status(@Req() req: { user: { organizationId: string } }) {
    return this.performanceService.getStatus(req.user.organizationId);
  }

  @Get('reviews')
  listReviews(
    @Query() query: PerformanceReviewQueryDto,
    @Req() req: { user: { organizationId: string } },
  ) {
    return this.performanceService.listReviews({
      ...query,
      organizationId: req.user.organizationId,
    });
  }

  @Post('reviews')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.HR_MANAGER, Role.MANAGER)
  upsertReview(
    @Body() dto: UpsertPerformanceReviewDto,
    @Req() req: { user: { organizationId: string } },
  ) {
    return this.performanceService.upsertReview({
      ...dto,
      organizationId: req.user.organizationId,
    });
  }

  @Post('review-cycle')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.HR_MANAGER)
  reviewCycle(
    @Body() dto: GenerateReviewCycleDto,
    @Req() req: { user: { organizationId: string } },
  ) {
    return this.performanceService.generateReviewCycle({
      ...dto,
      organizationId: req.user.organizationId,
    });
  }
}
