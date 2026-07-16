import { ApiResponse } from '@/lib/types';
import { BackendLeave, CreateLeavePayload, UpdateLeaveStatusPayload } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export const leavesApi = {
  async getAll(organizationId?: string): Promise<ApiResponse<BackendLeave[]>> {
    let url = `${API_BASE_URL}/leaves`;
    if (organizationId) {
      url += `?organizationId=${encodeURIComponent(organizationId)}`;
    }
    const response = await fetch(url);
    return response.json();
  },

  async getMyLeaves(userId: string): Promise<ApiResponse<BackendLeave[]>> {
    const response = await fetch(`${API_BASE_URL}/leaves/user/${encodeURIComponent(userId)}`);
    return response.json();
  },

  async create(payload: CreateLeavePayload): Promise<ApiResponse<BackendLeave>> {
    const response = await fetch(`${API_BASE_URL}/leaves`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return response.json();
  },

  async updateStatus(
    leaveId: string,
    payload: UpdateLeaveStatusPayload
  ): Promise<ApiResponse<BackendLeave>> {
    const response = await fetch(`${API_BASE_URL}/leaves/${encodeURIComponent(leaveId)}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return response.json();
  },

  async delete(leaveId: string): Promise<ApiResponse<void>> {
    const response = await fetch(`${API_BASE_URL}/leaves/${encodeURIComponent(leaveId)}`, {
      method: 'DELETE',
    });
    return response.json();
  },
};
