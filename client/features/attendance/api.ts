import { apiClient, buildQuery } from "@/lib/api-client";

export const attendanceApi = {
  clockIn: (data: unknown) => apiClient.post('/attendance/clock-in', data),
  clockOut: (data: unknown) => apiClient.post('/attendance/clock-out', data),
  getUserAttendance: (userId: string, from?: string, to?: string) =>
    apiClient.get(`/attendance/user/${userId}${buildQuery({ from, to })}`),
  getDailySummary: (userId: string, date?: string) =>
    apiClient.get(`/attendance/user/${userId}/daily-summary${buildQuery({ date })}`),
  startBreak: (data: unknown) => apiClient.post('/timelogs/break/start', data),
  endBreak: (data: unknown) => apiClient.post('/timelogs/break/end', data),
  adjustTimeLog: (id: string, data: unknown) => apiClient.patch(`/timelogs/${id}/adjust`, data),
};
