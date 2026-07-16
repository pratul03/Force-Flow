import { apiClient, buildQuery } from "@/lib/api-client";
import { DashboardChartsData, DashboardPeriod, DashboardStats } from "./types";

export const dashboardApi = {
  getStats: () => apiClient.get<DashboardStats>('/reports/dashboard/stats'),
  getCharts: (period: DashboardPeriod) =>
    apiClient.get<DashboardChartsData>(
      `/reports/dashboard/charts${buildQuery({ period })}`,
    ),
  getRecentActivities: () => apiClient.get('/audit/recent-activity'),
};
