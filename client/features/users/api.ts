import { apiClient } from "@/lib/api-client";
import { BackendUser } from "@/lib/types";

export const usersApi = {
  create: (data: unknown) => apiClient.post<BackendUser>('/users', data),
  getAll: () => apiClient.get<BackendUser[]>('/users'),
  getById: (id: string) => apiClient.get<BackendUser>(`/users/${id}`),
  update: (id: string, data: unknown) => apiClient.patch<BackendUser>(`/users/${id}`, data),
  delete: (id: string) => apiClient.delete<{ deleted: boolean; id: string }>(`/users/${id}`),
  getBankDetails: (id: string) => apiClient.get(`/users/${id}/bank-details`),
  updateBankDetails: (id: string, data: unknown) => apiClient.patch(`/users/${id}/bank-details`, data),
  getCompensation: (id: string) => apiClient.get(`/users/${id}/compensation`),
  updateCompensation: (id: string, data: unknown) => apiClient.patch(`/users/${id}/compensation`, data),
};
