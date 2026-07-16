import { apiClient } from "@/lib/api-client";
import { ReportsOverview } from "./types";

export const reportsApi = {
  overview: () => apiClient.get<ReportsOverview>('/reports/overview'),
};
