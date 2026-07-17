import { apiClient } from '@/lib/api-client';
import { ApiResponse } from '@/lib/types';
import {
  BackendLeave,
  CreateLeavePayload,
  UpdateLeavePayload,
  LeaveApprovalPayload,
  LeaveRejectionPayload,
  LeaveCancelPayload,
  LeavesQueryFilters,
} from './types';

export const leavesApi = {
  getAll: (filters?: LeavesQueryFilters) => {
    const params = new URLSearchParams();
    if (filters?.userId) params.append('userId', filters.userId);
    if (filters?.approverId) params.append('approverId', filters.approverId);
    if (filters?.status) params.append('status', filters.status);
    
    const queryString = params.toString();
    return apiClient.get<BackendLeave[]>(`/leaves${queryString ? `?${queryString}` : ''}`);
  },

  getPending: (approverId?: string) => {
    const params = new URLSearchParams();
    if (approverId) params.append('approverId', approverId);
    const queryString = params.toString();
    return apiClient.get<BackendLeave[]>(`/leaves/pending${queryString ? `?${queryString}` : ''}`);
  },

  getOne: (id: string) => {
    return apiClient.get<BackendLeave>(`/leaves/${id}`);
  },

  create: (payload: CreateLeavePayload) => {
    return apiClient.post<BackendLeave>('/leaves', payload);
  },

  apply: (payload: CreateLeavePayload) => {
    return apiClient.post<BackendLeave>('/leaves/apply', payload);
  },

  update: (id: string, payload: UpdateLeavePayload) => {
    return apiClient.patch<BackendLeave>(`/leaves/${id}`, payload);
  },

  approve: (id: string, payload: LeaveApprovalPayload = {}) => {
    return apiClient.post<BackendLeave>(`/leaves/${id}/approve`, payload);
  },

  reject: (id: string, payload: LeaveRejectionPayload) => {
    return apiClient.post<BackendLeave>(`/leaves/${id}/reject`, payload);
  },

  cancel: (id: string, payload: LeaveCancelPayload = {}) => {
    return apiClient.post<BackendLeave>(`/leaves/${id}/cancel`, payload);
  },

  delete: (id: string) => {
    return apiClient.delete<{ deleted: boolean; id: string }>(`/leaves/${id}`);
  },
};
