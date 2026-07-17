import { apiClient, buildQuery } from '@/lib/api-client';
import { TicketPriority, TicketStatus } from '@/lib/types';
import { 
  BackendTicket, 
  CreateTicketPayload, 
  AssignTicketPayload, 
  UpdateTicketStatusPayload,
  BackendTicketComment,
  BackendTicketStatusEvent,
  AddTicketCommentPayload,
  ReorderTicketsPayload,
  SwapTicketsPayload,
  UpdateTicketDetailsPayload,
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

  getBySlug: (slug: string) =>
    apiClient.get<BackendTicket>(`/tickets/by-slug/${slug}`),
    
  create: (data: CreateTicketPayload) => 
    apiClient.post<BackendTicket>('/tickets', data),
    
  assign: (id: string, data: AssignTicketPayload) =>
    apiClient.patch<BackendTicket>(`/tickets/${id}/assign`, data),
    
  updateStatus: (id: string, data: UpdateTicketStatusPayload) => 
    apiClient.patch<BackendTicket>(`/tickets/${id}/status`, data),
    
  updateDetails: (id: string, data: UpdateTicketDetailsPayload) =>
    apiClient.patch<BackendTicket>(`/tickets/${id}`, data),
    
  reorder: (data: ReorderTicketsPayload) =>
    apiClient.patch<void>(`/tickets/reorder`, data),

  swap: (data: SwapTicketsPayload) =>
    apiClient.patch<void>(`/tickets/swap`, data),

  comments: (id: string, params: { actorUserId: string; limit?: number }) =>
    apiClient.get<BackendTicketComment[]>(`/tickets/${id}/comments${buildQuery(params)}`),
    
  addComment: (id: string, data: AddTicketCommentPayload) => 
    apiClient.post<BackendTicketComment>(`/tickets/${id}/comments`, data),
    
  history: (id: string, params: { actorUserId: string; limit?: number }) =>
    apiClient.get<BackendTicketStatusEvent[]>(`/tickets/${id}/history${buildQuery(params)}`),
};
