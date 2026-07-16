import { apiClient, buildQuery } from '@/lib/api-client';
import * as types from '@/lib/types'; // Using generic types for now

export const shiftsApi = {
  create: (data: unknown) => apiClient.post('/shifts', data),
  getAll: (organizationId?: string) =>
    apiClient.get(`/shifts${buildQuery({ organizationId })}`),
  getById: (id: string) => apiClient.get(`/shifts/${id}`),
  update: (id: string, data: unknown) => apiClient.patch(`/shifts/${id}`, data),
  delete: (id: string) => apiClient.delete(`/shifts/${id}`),
  assign: (data: unknown) => apiClient.post('/shifts/assignments', data),
  assignmentList: (userId?: string) =>
    apiClient.get(`/shifts/assignments/list${buildQuery({ userId })}`),
};
