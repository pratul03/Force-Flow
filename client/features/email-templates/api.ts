import { apiClient, buildQuery } from '@/lib/api-client';
import * as types from '@/lib/types'; // Using generic types for now

export const emailTemplatesApi = {
  create: (data: unknown) => apiClient.post('/email-templates', data),
  list: (params?: { organizationId?: string; key?: string; isActive?: boolean }) =>
    apiClient.get(`/email-templates${buildQuery(params || {})}`),
  getById: (id: string) => apiClient.get(`/email-templates/${id}`),
  update: (id: string, data: unknown) => apiClient.patch(`/email-templates/${id}`, data),
  delete: (id: string) => apiClient.delete(`/email-templates/${id}`),
};
