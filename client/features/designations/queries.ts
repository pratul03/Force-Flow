import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { designationsApi } from './api';
import { CreateDesignationPayload, UpdateDesignationPayload } from './types';

export const designationKeys = {
  all: ['designations'] as const,
  list: (orgId?: string) => [...designationKeys.all, 'list', orgId] as const,
  detail: (id: string) => [...designationKeys.all, 'detail', id] as const,
};

export function useDesignations(organizationId?: string) {
  return useQuery({
    queryKey: designationKeys.list(organizationId),
    queryFn: async () => {
      const res = await designationsApi.getAll(organizationId);
      if (!res.success) throw new Error(res.error);
      return res.data!;
    },
    enabled: !!organizationId,
  });
}

export function useDesignation(id: string) {
  return useQuery({
    queryKey: designationKeys.detail(id),
    queryFn: async () => {
      const res = await designationsApi.getById(id);
      if (!res.success) throw new Error(res.error);
      return res.data!;
    },
    enabled: !!id,
  });
}

export function useCreateDesignation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (payload: CreateDesignationPayload) => designationsApi.create(payload),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: designationKeys.all });
      }
    },
  });
}

export function useUpdateDesignation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateDesignationPayload }) => 
      designationsApi.update(id, payload),
    onSuccess: (res, variables) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: designationKeys.all });
        queryClient.invalidateQueries({ queryKey: designationKeys.detail(variables.id) });
      }
    },
  });
}

export function useDeleteDesignation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => designationsApi.delete(id),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: designationKeys.all });
      }
    },
  });
}
