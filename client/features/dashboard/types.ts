export interface DashboardStats {
  totalEmployees: number;
  presentToday: number;
  onLeave: number;
  absentToday: number;
  pendingLeaveRequests: number;
  pendingTimesheets: number;
}

export type DashboardPeriod = 'monthly' | 'yearly' | 'overall';

export interface DashboardChartPoint {
  label: string;
  value: number;
}

export interface DashboardDistributionPoint extends DashboardChartPoint {
  color: string;
}

export interface DashboardChartsData {
  period: DashboardPeriod;
  currency: string;
  attendanceTrend: DashboardChartPoint[];
  workload: DashboardChartPoint[];
  departmentDistribution: DashboardDistributionPoint[];
  salaryDistribution: DashboardDistributionPoint[];
  totalSalary: number;
  generatedAt: string;
}
