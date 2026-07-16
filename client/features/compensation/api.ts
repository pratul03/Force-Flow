import { apiClient, buildQuery } from '@/lib/api-client';
import * as types from '@/lib/types'; // Using generic types for now

export const compensationApi = {
  status: () => apiClient.get('/compensation/status'),
  preview: (userId: string, month?: number, year?: number) =>
    apiClient.get(`/compensation/preview/${userId}${buildQuery({ month, year })}`),
  settlements: (params?: { userId?: string; month?: number; year?: number }) =>
    apiClient.get(`/compensation/settlements${buildQuery(params || {})}`),
  recalculate: (data: unknown) => apiClient.post('/compensation/recalculate', data),
};
