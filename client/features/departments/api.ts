import { apiClient } from '@/lib/api-client';
import { Department, CreateDepartmentPayload, UpdateDepartmentPayload } from './types';

export const departmentsApi = {
  getAll: (organizationId?: string) => {
    let url = '/departments';
    if (organizationId) {
      url += `?organizationId=${encodeURIComponent(organizationId)}`;
    }
    return apiClient.get<Department[]>(url);
  },
  getById: (id: string) => apiClient.get<Department>(`/departments/${id}`),
  create: (data: CreateDepartmentPayload) => apiClient.post<Department>('/departments', data),
  update: (id: string, data: UpdateDepartmentPayload) => apiClient.patch<Department>(`/departments/${id}`, data),
  delete: (id: string) => apiClient.delete<{ deleted: boolean; id: string }>(`/departments/${id}`),
};
