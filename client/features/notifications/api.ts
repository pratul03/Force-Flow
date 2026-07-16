import { apiClient, buildQuery } from '@/lib/api-client';
import * as types from '@/lib/types'; // Using generic types for now

export const notificationsApi = {
  send: (data: unknown) => apiClient.post('/notifications/send', data),
  logs: (params?: { userId?: string; status?: string; limit?: number }) =>
    apiClient.get(`/notifications/logs${buildQuery(params || {})}`),
};
