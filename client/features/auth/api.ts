import { apiClient } from "@/lib/api-client";
import { LoginResponse } from "./types";

export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post<LoginResponse>('/auth/login', { email, password }),

  refreshToken: (refreshToken?: string) =>
    apiClient.post<LoginResponse>('/auth/refresh',
      refreshToken ? { refreshToken } : undefined),

  logout: (refreshToken?: string) =>
    apiClient.post<{ loggedOut: boolean }>('/auth/logout',
      refreshToken ? { refreshToken } : undefined),

  register: async (data: {
    name: string;
    email: string;
    password: string;
    organizationName?: string;
    country?: string;
  }) => apiClient.post<LoginResponse>('/auth/register', data),
};
