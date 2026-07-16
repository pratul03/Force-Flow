import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ticketsApi, ListTicketsParams } from './api';
import { CreateTicketPayload, AssignTicketPayload, UpdateTicketStatusPayload, AddTicketCommentPayload } from './types';

export const ticketKeys = {
  all: ['tickets'] as const,
  list: (params: ListTicketsParams) => [...ticketKeys.all, 'list', params] as const,
  detail: (id: string) => [...ticketKeys.all, 'detail', id] as const,
  comments: (id: string) => [...ticketKeys.all, 'comments', id] as const,
  history: (id: string) => [...ticketKeys.all, 'history', id] as const,
};

export function useTickets(params: ListTicketsParams = {}) {
  return useQuery({
    queryKey: ticketKeys.list(params),
    queryFn: async () => {
      const res = await ticketsApi.list(params);
      if (!res.success) throw new Error(res.error);
      return res.data!;
    },
    enabled: !!params.organizationId,
  });
}

export function useTicket(id: string) {
  return useQuery({
    queryKey: ticketKeys.detail(id),
    queryFn: async () => {
      const res = await ticketsApi.getById(id);
      if (!res.success) throw new Error(res.error);
      return res.data!;
    },
    enabled: !!id,
  });
}

export function useCreateTicket() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (payload: CreateTicketPayload) => ticketsApi.create(payload),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: ticketKeys.all });
      }
    },
  });
}

export function useAssignTicket() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AssignTicketPayload }) => 
      ticketsApi.assign(id, payload),
    onSuccess: (res, variables) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: ticketKeys.all });
        queryClient.invalidateQueries({ queryKey: ticketKeys.detail(variables.id) });
      }
    },
  });
}

export function useUpdateTicketStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTicketStatusPayload }) => 
      ticketsApi.updateStatus(id, payload),
    onSuccess: (res, variables) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: ticketKeys.all });
        queryClient.invalidateQueries({ queryKey: ticketKeys.detail(variables.id) });
        queryClient.invalidateQueries({ queryKey: ticketKeys.history(variables.id) });
      }
    },
  });
}

export function useTicketComments(id: string, actorUserId?: string) {
  return useQuery({
    queryKey: ticketKeys.comments(id),
    queryFn: async () => {
      if (!actorUserId) return [];
      const res = await ticketsApi.comments(id, { actorUserId, limit: 250 });
      if (!res.success) throw new Error(res.error);
      return res.data!;
    },
    enabled: !!id && !!actorUserId,
  });
}

export function useTicketHistory(id: string, actorUserId?: string) {
  return useQuery({
    queryKey: ticketKeys.history(id),
    queryFn: async () => {
      if (!actorUserId) return [];
      const res = await ticketsApi.history(id, { actorUserId, limit: 250 });
      if (!res.success) throw new Error(res.error);
      return res.data!;
    },
    enabled: !!id && !!actorUserId,
  });
}

export function useAddTicketComment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: AddTicketCommentPayload }) => 
      ticketsApi.addComment(id, payload),
    onSuccess: (res, variables) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: ticketKeys.comments(variables.id) });
        queryClient.invalidateQueries({ queryKey: ticketKeys.detail(variables.id) });
        queryClient.invalidateQueries({ queryKey: ticketKeys.list({}) });
      }
    },
  });
}
