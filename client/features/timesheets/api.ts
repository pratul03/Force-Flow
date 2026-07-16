import { apiClient } from '@/lib/api-client';
import { BackendTimeLog, CreateTimeLogPayload, UpdateTimeLogPayload } from './types';

export const timesheetsApi = {
  create: (data: CreateTimeLogPayload) => apiClient.post<BackendTimeLog>('/timelogs', data),
  
  getAll: (userId?: string) => {
    let url = '/timelogs';
    if (userId) {
      url += `?userId=${encodeURIComponent(userId)}`;
    }
    return apiClient.get<BackendTimeLog[]>(url);
  },
  
  getById: (id: string) => apiClient.get<BackendTimeLog>(`/timelogs/${id}`),
  
  update: (id: string, data: UpdateTimeLogPayload) => apiClient.patch<BackendTimeLog>(`/timelogs/${id}`, data),
  
  delete: (id: string) => apiClient.delete<{ deleted: boolean; id: string }>(`/timelogs/${id}`),
};
