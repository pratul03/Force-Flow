import {
  Controller,
  Get,
  Query,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
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

  @Get('export/employees')
  async exportEmployees(@Req() req: AuthenticatedRequest, @Res() res: Response) {
    const csv = await this.reportsService.exportEmployeesCsv(this.requireOrganizationId(req));
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="employees_export.csv"');
    res.send(csv);
  }

  @Get('export/leaves')
  async exportLeaves(@Req() req: AuthenticatedRequest, @Res() res: Response) {
    const csv = await this.reportsService.exportLeavesCsv(this.requireOrganizationId(req));
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="leaves_export.csv"');
    res.send(csv);
  }

  private requireOrganizationId(req: AuthenticatedRequest): string {
    const organizationId = req.user?.organizationId;
    if (!organizationId) {
      throw new UnauthorizedException('Organization context is missing');
    }

    return organizationId;
  }
}
