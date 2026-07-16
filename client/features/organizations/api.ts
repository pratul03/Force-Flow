import { apiClient } from "@/lib/api-client";
import { BackendOrganization } from "./types";

export const organizationsApi = {
  create: (data: unknown) => apiClient.post<{ id: string }>('/organizations', data),
  getAll: () => apiClient.get<Array<BackendOrganization>>('/organizations'),
  getById: (id: string) => apiClient.get<BackendOrganization>(`/organizations/${id}`),
  update: (id: string, data: unknown) =>
    apiClient.patch<BackendOrganization>(`/organizations/${id}`, data),
  delete: (id: string) => apiClient.delete(`/organizations/${id}`),
};
