import { apiClient, buildQuery } from '@/lib/api-client';
import * as types from '@/lib/types'; // Using generic types for now

export const locationsApi = {
  create: (data: unknown) => apiClient.post('/locations', data),
  getAll: (organizationId?: string) =>
    apiClient.get(`/locations${buildQuery({ organizationId })}`),
  getById: (id: string) => apiClient.get(`/locations/${id}`),
  update: (id: string, data: unknown) => apiClient.patch(`/locations/${id}`, data),
  delete: (id: string) => apiClient.delete(`/locations/${id}`),
};
