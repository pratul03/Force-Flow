import { apiClient, buildQuery } from '@/lib/api-client';
import * as types from '@/lib/types'; // Using generic types for now

export const invoiceTemplatesApi = {
  create: (data: unknown) => apiClient.post('/invoice-templates', data),
  list: (params?: {
    organizationId?: string;
    key?: string;
    isDefault?: boolean;
    isActive?: boolean;
  }) => apiClient.get(`/invoice-templates${buildQuery(params || {})}`),
  getById: (id: string) => apiClient.get(`/invoice-templates/${id}`),
  update: (id: string, data: unknown) => apiClient.patch(`/invoice-templates/${id}`, data),
  delete: (id: string) => apiClient.delete(`/invoice-templates/${id}`),
};

