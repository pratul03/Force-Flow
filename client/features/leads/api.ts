import { apiClient, buildQuery } from '@/lib/api-client';
import { LeadStatus } from '@/lib/types';
import { BackendLead, CreateLeadPayload, UpdateLeadPayload } from './types';

export type ListLeadsParams = {
  organizationId?: string;
  status?: LeadStatus;
  search?: string;
  limit?: number;
}

export const leadsApi = {
  list: (params?: ListLeadsParams) => 
    apiClient.get<BackendLead[]>(`/leads${buildQuery(params || {})}`),
    
  getById: (id: string) => 
    apiClient.get<BackendLead>(`/leads/${id}`),
    
  create: (data: CreateLeadPayload) => 
    apiClient.post<BackendLead>('/leads', data),
    
  update: (id: string, data: UpdateLeadPayload) => 
    apiClient.patch<BackendLead>(`/leads/${id}`, data),
    
  delete: (id: string) => 
    apiClient.delete(`/leads/${id}`),
};
