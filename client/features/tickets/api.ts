import { apiClient, buildQuery } from '@/lib/api-client';
import { TicketPriority, TicketStatus } from '@/lib/types';
import { 
  BackendTicket, 
  CreateTicketPayload, 
  AssignTicketPayload, 
  UpdateTicketStatusPayload,
  BackendTicketComment,
  BackendTicketStatusEvent,
  AddTicketCommentPayload
} from './types';

export type ListTicketsParams = {
  organizationId?: string;
  requesterId?: string;
  assigneeId?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  limit?: number;
}

export const ticketsApi = {
  list: (params?: ListTicketsParams) => 
    apiClient.get<BackendTicket[]>(`/tickets${buildQuery(params || {})}`),
    
  getById: (id: string) => 
    apiClient.get<BackendTicket>(`/tickets/${id}`),
    
  create: (data: CreateTicketPayload) => 
    apiClient.post<BackendTicket>('/tickets', data),
    
  assign: (id: string, data: AssignTicketPayload) =>
    apiClient.patch<BackendTicket>(`/tickets/${id}/assign`, data),
    
  updateStatus: (id: string, data: UpdateTicketStatusPayload) => 
    apiClient.patch<BackendTicket>(`/tickets/${id}/status`, data),
    
  comments: (id: string, params: { actorUserId: string; limit?: number }) =>
    apiClient.get<BackendTicketComment[]>(`/tickets/${id}/comments${buildQuery(params)}`),
    
  addComment: (id: string, data: AddTicketCommentPayload) => 
    apiClient.post<BackendTicketComment>(`/tickets/${id}/comments`, data),
    
  history: (id: string, params: { actorUserId: string; limit?: number }) =>
    apiClient.get<BackendTicketStatusEvent[]>(`/tickets/${id}/history${buildQuery(params)}`),
};
