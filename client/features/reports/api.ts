import { apiClient } from "@/lib/api-client";
import { ReportsOverview } from "./types";

export const reportsApi = {
  overview: () => apiClient.get<ReportsOverview>('/reports/overview'),
  
  exportEmployees: async () => {
    const blob = await apiClient.download('/reports/export/employees');
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'employees_export.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  exportLeaves: async () => {
    const blob = await apiClient.download('/reports/export/leaves');
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'leaves_export.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
};
