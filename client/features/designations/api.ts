import { apiClient } from '@/lib/api-client';
import { Designation, CreateDesignationPayload, UpdateDesignationPayload } from './types';

export const designationsApi = {
  getAll: (organizationId?: string) => {
    let url = '/designations';
    if (organizationId) {
      url += `?organizationId=${encodeURIComponent(organizationId)}`;
    }
    return apiClient.get<Designation[]>(url);
  },
  getById: (id: string) => apiClient.get<Designation>(`/designations/${id}`),
  create: (data: CreateDesignationPayload) => apiClient.post<Designation>('/designations', data),
  update: (id: string, data: UpdateDesignationPayload) => apiClient.patch<Designation>(`/designations/${id}`, data),
  delete: (id: string) => apiClient.delete<{ deleted: boolean; id: string }>(`/designations/${id}`),
};
