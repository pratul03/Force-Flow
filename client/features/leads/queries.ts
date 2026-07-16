import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leadsApi, ListLeadsParams } from './api';
import { CreateLeadPayload, UpdateLeadPayload } from './types';

export const leadKeys = {
  all: ['leads'] as const,
  list: (params: ListLeadsParams) => [...leadKeys.all, 'list', params] as const,
  detail: (id: string) => [...leadKeys.all, 'detail', id] as const,
};

export function useLeads(params: ListLeadsParams = {}) {
  return useQuery({
    queryKey: leadKeys.list(params),
    queryFn: async () => {
      const res = await leadsApi.list(params);
      if (!res.success) throw new Error(res.error);
      return res.data!;
    },
    enabled: !!params.organizationId,
  });
}

export function useLead(id: string) {
  return useQuery({
    queryKey: leadKeys.detail(id),
    queryFn: async () => {
      const res = await leadsApi.getById(id);
      if (!res.success) throw new Error(res.error);
      return res.data!;
    },
    enabled: !!id,
  });
}

export function useCreateLead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (payload: CreateLeadPayload) => leadsApi.create(payload),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: leadKeys.all });
      }
    },
  });
}

export function useUpdateLead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateLeadPayload }) => 
      leadsApi.update(id, payload),
    onSuccess: (res, variables) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: leadKeys.all });
        queryClient.invalidateQueries({ queryKey: leadKeys.detail(variables.id) });
      }
    },
  });
}

export function useDeleteLead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => leadsApi.delete(id),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: leadKeys.all });
      }
    },
  });
}
