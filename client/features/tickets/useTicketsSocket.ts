import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { ticketKeys } from './queries';
import { BackendTicket } from './types';

let socket: Socket | null = null;

export function useTicketsSocket(organizationId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!organizationId) return;

    if (!socket) {
      // Ensure we hit the backend API URL. Next.js env vars are exposed to client with NEXT_PUBLIC_
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      // Socket.IO namespaces connect to the base URL usually, so we extract origin
      const origin = new URL(apiUrl).origin;
      
      socket = io(origin + '/tickets', {
        transports: ['websocket'],
      });
    }

    socket.on('connect', () => {
      console.log('[useTicketsSocket] Connected to server, joining room:', organizationId);
      socket?.emit('joinOrganization', organizationId);
    });
    
    socket.on('connect_error', (err) => {
      console.error('[useTicketsSocket] Connection error:', err);
    });

    const onTicketUpdated = (updatedTicket: BackendTicket) => {
      console.log('[useTicketsSocket] Received ticket.updated', updatedTicket);
      queryClient.setQueriesData({ queryKey: ticketKeys.all }, (old: any) => {
        if (!Array.isArray(old)) return old;
        const exists = old.find((t: { id: string; }) => t.id === updatedTicket.id);
        if (exists) {
          return old.map((t: { id: string; }) => (t.id === updatedTicket.id ? updatedTicket : t));
        }
        return [...old, updatedTicket];
      });
      
      // Update detail view as well
      queryClient.setQueryData(ticketKeys.detail(updatedTicket.id), updatedTicket);
      
      // Invalidate related queries so they refetch (or fetch fresh when accessed)
      queryClient.invalidateQueries({ queryKey: ticketKeys.bySlug(updatedTicket.slug) });
      queryClient.invalidateQueries({ queryKey: ticketKeys.history(updatedTicket.id) });
      queryClient.invalidateQueries({ queryKey: ticketKeys.comments(updatedTicket.id) });
    };

    const onTicketsReordered = (updates: { id: string; orderIndex: number }[]) => {
      console.log('[useTicketsSocket] Received tickets.reordered', updates);
      queryClient.setQueriesData({ queryKey: ticketKeys.all }, (old: any) => {
        if (!Array.isArray(old)) return old;
        const updatesMap = new Map(updates.map((u: { id: string; orderIndex: number }) => [u.id, u.orderIndex]));
        return old.map((t: { id: string; }) =>
          updatesMap.has(t.id) ? { ...t, orderIndex: updatesMap.get(t.id)! } : t
        );
      });
    };
    
    const onTicketsSwapped = (payload: { ticket1: { id: string; orderIndex: number }, ticket2: { id: string; orderIndex: number } }) => {
      console.log('[useTicketsSocket] Received tickets.swapped', payload);
      queryClient.setQueriesData({ queryKey: ticketKeys.all }, (old: any) => {
        if (!Array.isArray(old)) return old;
        return old.map((t: { id: string; }) => {
           if (t.id === payload.ticket1.id) return { ...t, orderIndex: payload.ticket1.orderIndex };
           if (t.id === payload.ticket2.id) return { ...t, orderIndex: payload.ticket2.orderIndex };
           return t;
        });
      });
    }

    socket.on('ticket.created', onTicketUpdated);
    socket.on('ticket.updated', onTicketUpdated);
    socket.on('tickets.reordered', onTicketsReordered);
    socket.on('tickets.swapped', onTicketsSwapped);

    return () => {
      socket?.off('ticket.created', onTicketUpdated);
      socket?.off('ticket.updated', onTicketUpdated);
      socket?.off('tickets.reordered', onTicketsReordered);
      socket?.off('tickets.swapped', onTicketsSwapped);
    };
  }, [organizationId, queryClient]);
}
