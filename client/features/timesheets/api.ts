import { apiClient } from '@/lib/api-client';
import { BackendTimeLog, CreateTimeLogPayload, UpdateTimeLogPayload } from './types';

export const timesheetsApi = {
  create: (data: CreateTimeLogPayload) => apiClient.post<BackendTimeLog>('/attendance/clock-in', data),
  
  getAll: (userId?: string) => {
    // If we're fetching for a specific user, call the user attendance route
    if (userId) {
      return apiClient.get<BackendTimeLog[]>(`/attendance/user/${encodeURIComponent(userId)}`);
    }
    // Otherwise fetch the whole organization's timesheets
    return apiClient.get<BackendTimeLog[]>('/attendance/organization');
  },
  
  getById: (id: string) => apiClient.get<BackendTimeLog>(`/attendance/timelogs/${id}`),
  
  update: (id: string, data: UpdateTimeLogPayload) => {
    // Check if it's a status update
    if (data.status) {
      return apiClient.patch<BackendTimeLog>(`/attendance/timelogs/${id}/status`, data);
    }
    return apiClient.patch<BackendTimeLog>(`/attendance/timelogs/${id}/adjust`, data);
  },
  
  delete: (id: string) => apiClient.delete<{ deleted: boolean; id: string }>(`/timelogs/${id}`),
};
