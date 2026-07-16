import { apiClient, buildQuery } from '@/lib/api-client';
import * as types from '@/lib/types'; // Using generic types for now

export const assetsApi = {
  status: (organizationId?: string) => apiClient.get(`/assets/status${buildQuery({ organizationId })}`),
  list: (params?: { organizationId?: string; status?: string; assignedToUserId?: string }) =>
    apiClient.get(`/assets${buildQuery(params || {})}`),
  create: (data: unknown) => apiClient.post('/assets', data),
  assign: (id: string, data: unknown) => apiClient.patch(`/assets/${id}/assign`, data),
  depreciation: (data: unknown) => apiClient.post('/assets/depreciation', data),
};
