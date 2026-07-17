import { apiClient, buildQuery } from "@/lib/api-client";

export const attendanceApi = {
  clockIn: (data: unknown) => apiClient.post('/attendance/clock-in', data),
  clockOut: (data: unknown) => apiClient.post('/attendance/clock-out', data),
  getUserAttendance: (userId: string, from?: string, to?: string) =>
    apiClient.get(`/attendance/user/${userId}${buildQuery({ from, to })}`),
  getDailySummary: (userId: string, date?: string) =>
    apiClient.get(`/attendance/user/${userId}/daily-summary${buildQuery({ date })}`),
  getOrganizationAttendance: (from?: string, to?: string) =>
    apiClient.get(`/attendance/organization${buildQuery({ from, to })}`),
  updateTimeLogStatus: (userId: string, timeLogId: string, status: string, notes?: string) =>
    apiClient.patch(`/attendance/user/${userId}/timelogs/${timeLogId}/status`, { status, notes }),
  startBreak: (data: unknown) => apiClient.post('/timelogs/break/start', data),
  endBreak: (data: unknown) => apiClient.post('/timelogs/break/end', data),
  adjustTimeLog: (userId: string, timeLogId: string, data: unknown) => 
    apiClient.patch(`/attendance/user/${userId}/timelogs/${timeLogId}/adjust`, data),
};
