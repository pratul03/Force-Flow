import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shiftsApi } from './api';
import { BackendShift, CreateShiftPayload, UpdateShiftPayload, ShiftAssignmentPayload } from './types';
import { toast } from 'sonner';

export const shiftKeys = {
  all: ['shifts'] as const,
  lists: () => [...shiftKeys.all, 'list'] as const,
  list: (params: string) => [...shiftKeys.lists(), { params }] as const,
  details: () => [...shiftKeys.all, 'detail'] as const,
  detail: (id: string) => [...shiftKeys.details(), id] as const,
  assignments: (id: string) => [...shiftKeys.detail(id), 'assignments'] as const,
};

export function useShifts(params?: { organizationId?: string }) {
  return useQuery({
    queryKey: shiftKeys.list(JSON.stringify(params || {})),
    queryFn: async () => {
      const res = await shiftsApi.list(params);
      if (!res.success) throw new Error(res.error || 'Failed to fetch shifts');
      return res.data as BackendShift[];
    },
  });
}

export function useShift(id: string) {
  return useQuery({
    queryKey: shiftKeys.detail(id),
    queryFn: async () => {
      const res = await shiftsApi.getById(id);
      if (!res.success) throw new Error(res.error || 'Failed to fetch shift');
      return res.data as BackendShift;
    },
    enabled: !!id,
  });
}

export function useCreateShift() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateShiftPayload) => {
      const res = await shiftsApi.create(data);
      if (!res.success) throw new Error(res.error || 'Failed to create shift');
      return res.data as BackendShift;
    },
    onSuccess: () => {
      toast.success('Shift created successfully');
      queryClient.invalidateQueries({ queryKey: shiftKeys.lists() });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to create shift');
    },
  });
}

export function useUpdateShift() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateShiftPayload }) => {
      const res = await shiftsApi.update(id, data);
      if (!res.success) throw new Error(res.error || 'Failed to update shift');
      return res.data as BackendShift;
    },
    onSuccess: (_, variables) => {
      toast.success('Shift updated successfully');
      queryClient.invalidateQueries({ queryKey: shiftKeys.lists() });
      queryClient.invalidateQueries({ queryKey: shiftKeys.detail(variables.id) });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update shift');
    },
  });
}

export function useDeleteShift() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await shiftsApi.delete(id);
      if (!res.success) throw new Error(res.error || 'Failed to delete shift');
      return true;
    },
    onSuccess: () => {
      toast.success('Shift deleted successfully');
      queryClient.invalidateQueries({ queryKey: shiftKeys.lists() });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete shift');
    },
  });
}
