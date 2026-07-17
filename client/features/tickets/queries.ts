import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ticketsApi, ListTicketsParams } from './api';
import { CreateTicketPayload, AssignTicketPayload, UpdateTicketStatusPayload, AddTicketCommentPayload, ReorderTicketsPayload, SwapTicketsPayload, UpdateTicketDetailsPayload } from './types';

export const ticketKeys = {
  all: ['tickets'] as const,
  list: (params: ListTicketsParams) => [...ticketKeys.all, 'list', params] as const,
  detail: (id: string) => [...ticketKeys.all, 'detail', id] as const,
  bySlug: (slug: string) => [...ticketKeys.all, 'by-slug', slug] as const,
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

export function useTicketBySlug(slug: string) {
  return useQuery({
    queryKey: ticketKeys.bySlug(slug),
    queryFn: async () => {
      const res = await ticketsApi.getBySlug(slug);
      if (!res.success) throw new Error(res.error);
      return res.data!;
    },
    enabled: !!slug,
    staleTime: 0, // Always fetch fresh data on mount
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
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: ticketKeys.all });
      const previousTickets = queryClient.getQueriesData({ queryKey: ticketKeys.all });
      
      queryClient.setQueriesData({ queryKey: ticketKeys.all }, (old: any) => {
        if (!Array.isArray(old)) return old;
        return old.map((t: any) => t.id === id ? { ...t, assigneeId: payload.assigneeId, status: payload.status || t.status } : t);
      });
      
      return { previousTickets };
    },
    onSuccess: (res) => {
      if (res.success && res.data) {
        queryClient.setQueriesData({ queryKey: ticketKeys.all }, (old: any) => {
          if (!Array.isArray(old)) return old;
          return old.map((t: any) => t.id === res.data!.id ? res.data : t);
        });
      }
    },
    onError: (err, variables, context) => {
      if (context?.previousTickets) {
        context.previousTickets.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: (res, err, variables) => {
      // WebSocket handles ticketKeys.all updates
      if (variables?.id) {
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
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: ticketKeys.all });
      const previousTickets = queryClient.getQueriesData({ queryKey: ticketKeys.all });
      
      queryClient.setQueriesData({ queryKey: ticketKeys.all }, (old: any) => {
        if (!Array.isArray(old)) return old;
        return old.map((t: any) => t.id === id ? { 
          ...t, 
          status: payload.status,
          ...(payload.status === "OPEN" ? { assigneeId: null, assignee: null } : {})
        } : t);
      });
      
      return { previousTickets };
    },
    onSuccess: (res) => {
      if (res.success && res.data) {
        queryClient.setQueriesData({ queryKey: ticketKeys.all }, (old: any) => {
          if (!Array.isArray(old)) return old;
          return old.map((t: any) => t.id === res.data!.id ? res.data : t);
        });
      }
    },
    onError: (err, variables, context) => {
      if (context?.previousTickets) {
        context.previousTickets.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: (res, err, variables) => {
      // WebSocket handles ticketKeys.all updates
      if (variables?.id) {
        queryClient.invalidateQueries({ queryKey: ticketKeys.detail(variables.id) });
        queryClient.invalidateQueries({ queryKey: ticketKeys.history(variables.id) });
      }
    },
  });
}

export function useUpdateTicketDetails() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTicketDetailsPayload }) => 
      ticketsApi.updateDetails(id, payload),
    onSuccess: (res, variables) => {
      if (res.success && res.data) {
        queryClient.setQueriesData({ queryKey: ticketKeys.all }, (old: any) => {
          if (!Array.isArray(old)) return old;
          return old.map((t: any) => t.id === res.data!.id ? res.data : t);
        });
        queryClient.invalidateQueries({ queryKey: ticketKeys.detail(variables.id) });
        queryClient.invalidateQueries({ queryKey: ticketKeys.bySlug(res.data.slug) });
        queryClient.invalidateQueries({ queryKey: ticketKeys.history(variables.id) });
      }
    },
  });
}

export function useReorderTickets() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (payload: ReorderTicketsPayload) => 
      ticketsApi.reorder(payload),
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: ticketKeys.all });
      const previousTickets = queryClient.getQueriesData({ queryKey: ticketKeys.all });
      
      queryClient.setQueriesData({ queryKey: ticketKeys.all }, (old: any) => {
        if (!Array.isArray(old)) return old;
        const updatesMap = new Map(payload.updates.map(u => [u.id, u.orderIndex]));
        return old.map((t: any) => updatesMap.has(t.id) ? { ...t, orderIndex: updatesMap.get(t.id) } : t);
      });
      
      return { previousTickets };
    },
    onError: (err, variables, context) => {
      if (context?.previousTickets) {
        context.previousTickets.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      // WebSocket handles ticketKeys.all updates
    },
  });
}

export function useSwapTickets() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (payload: SwapTicketsPayload) => 
      ticketsApi.swap(payload),
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey: ticketKeys.all });
      const previousTickets = queryClient.getQueriesData({ queryKey: ticketKeys.all });
      
      queryClient.setQueriesData({ queryKey: ticketKeys.all }, (old: any) => {
        if (!Array.isArray(old)) return old;
        const t1 = old.find((t: any) => t.id === payload.ticket1Id);
        const t2 = old.find((t: any) => t.id === payload.ticket2Id);
        if (!t1 || !t2) return old;
        
        const idx1 = t1.orderIndex;
        const idx2 = t2.orderIndex;
        return old.map((t: any) => {
          if (t.id === payload.ticket1Id) return { ...t, orderIndex: idx2 };
          if (t.id === payload.ticket2Id) return { ...t, orderIndex: idx1 };
          return t;
        });
      });
      
      return { previousTickets };
    },
    onError: (err, variables, context) => {
      if (context?.previousTickets) {
        context.previousTickets.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      // WebSocket handles ticketKeys.all updates
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
    staleTime: 0, // Always fetch fresh data on mount
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
    staleTime: 0, // Always fetch fresh data on mount
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
