import { apiClient, buildQuery } from '@/lib/api-client';
import * as types from '@/lib/types'; // Using generic types for now

export const holidaysApi = {
  status: () => apiClient.get('/holidays/status'),
  list: (params?: { organizationId?: string; from?: string; to?: string }) =>
    apiClient.get(`/holidays${buildQuery(params || {})}`),
  create: (data: unknown) => apiClient.post('/holidays', data),
  sync: (data: unknown) => apiClient.post('/holidays/sync', data),
  delete: (id: string) => apiClient.delete(`/holidays/${id}`),
};
