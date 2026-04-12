import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../../common/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/auth/guards/roles.guard';
import { Roles } from '../../../common/auth/roles.decorator';
import { PerformanceService } from '../services/performance.service';
import { GenerateReviewCycleDto } from '../dto/generate-review-cycle.dto';
import { PerformanceReviewQueryDto } from '../dto/performance-review-query.dto';
import { UpsertPerformanceReviewDto } from '../dto/upsert-performance-review.dto';

@Controller('performance')
export class PerformanceController {
  constructor(private readonly performanceService: PerformanceService) {}

  @Get('status')
  status(@Query('organizationId') organizationId?: string) {
    return this.performanceService.getStatus(organizationId);
  }

  @Get('reviews')
  listReviews(@Query() query: PerformanceReviewQueryDto) {
    return this.performanceService.listReviews(query);
  }

  @Post('reviews')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.HR_MANAGER, Role.MANAGER)
  upsertReview(@Body() dto: UpsertPerformanceReviewDto) {
    return this.performanceService.upsertReview(dto);
  }

  @Post('review-cycle')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.HR_MANAGER)
  reviewCycle(@Body() dto: GenerateReviewCycleDto) {
    return this.performanceService.generateReviewCycle(dto);
  }
}
