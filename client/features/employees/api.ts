import { apiClient, buildQuery } from '@/lib/api-client';
import { BackendUser } from '@/lib/types';
import { CreateEmployeePayload, UpdateEmployeePayload } from './types';

export const employeesApi = {
  getAll: () => apiClient.get<BackendUser[]>('/users'),
  getById: (id: string) => apiClient.get<BackendUser>(`/users/${id}`),
  create: (data: CreateEmployeePayload) => apiClient.post<BackendUser>('/users', data),
  update: (id: string, data: UpdateEmployeePayload) => apiClient.patch<BackendUser>(`/users/${id}`, data),
  delete: (id: string) => apiClient.delete<{ deleted: boolean; id: string }>(`/users/${id}`),
};
