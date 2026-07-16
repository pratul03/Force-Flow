import { IsIn, IsOptional } from 'class-validator';

export const dashboardPeriods = ['monthly', 'yearly', 'overall'] as const;
export type DashboardPeriod = (typeof dashboardPeriods)[number];

export class DashboardChartsQueryDto {
  @IsOptional()
  @IsIn(dashboardPeriods)
  period?: DashboardPeriod;
}
