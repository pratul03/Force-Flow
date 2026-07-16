import {
  Controller,
  Get,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../common/auth/guards/jwt-auth.guard';
import {
  DashboardChartsQueryDto,
  DashboardPeriod,
} from '../dto/dashboard-charts-query.dto';
import { ReportsService } from '../services/reports.service';

type AuthenticatedRequest = {
  user?: {
    organizationId?: string;
  };
};

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('overview')
  overview(@Req() req: AuthenticatedRequest) {
    return this.reportsService.overview(this.requireOrganizationId(req));
  }

  @Get('dashboard/stats')
  dashboardStats(@Req() req: AuthenticatedRequest) {
    return this.reportsService.dashboardStats(this.requireOrganizationId(req));
  }

  @Get('dashboard/charts')
  dashboardCharts(
    @Req() req: AuthenticatedRequest,
    @Query() query: DashboardChartsQueryDto,
  ) {
    return this.reportsService.dashboardCharts(
      this.requireOrganizationId(req),
      (query.period ?? 'monthly') as DashboardPeriod,
    );
  }

  private requireOrganizationId(req: AuthenticatedRequest): string {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw new UnauthorizedException('Organization context is missing');
    }

    return organizationId;
  }
}
