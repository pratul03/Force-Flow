import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "./api";
import { DashboardPeriod } from "./types";

export const dashboardKeys = {
  all: ["dashboard"] as const,
  stats: () => [...dashboardKeys.all, "stats"] as const,
  charts: (period: DashboardPeriod) => [...dashboardKeys.all, "charts", period] as const,
  recentActivities: () => [...dashboardKeys.all, "activities"] as const,
};

export function useDashboardStats() {
  return useQuery({
    queryKey: dashboardKeys.stats(),
    queryFn: async () => {
      const response = await dashboardApi.getStats();
      if (!response.success || !response.data) {
        throw new Error(response.error || "Failed to fetch stats");
      }
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useDashboardCharts(period: DashboardPeriod) {
  return useQuery({
    queryKey: dashboardKeys.charts(period),
    queryFn: async () => {
      const response = await dashboardApi.getCharts(period);
      if (!response.success || !response.data) {
        throw new Error(response.error || "Failed to fetch charts");
      }
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useRecentActivities() {
  return useQuery({
    queryKey: dashboardKeys.recentActivities(),
    queryFn: async () => {
      const response = await dashboardApi.getRecentActivities();
      if (!response.success || !response.data) {
        throw new Error(response.error || "Failed to fetch activities");
      }
      return response.data as any[];
    },
    staleTime: 60 * 1000,
  });
}
