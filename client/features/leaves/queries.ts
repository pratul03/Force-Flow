import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leavesApi } from './api';
import {
  CreateLeavePayload,
  UpdateLeavePayload,
  LeaveApprovalPayload,
  LeaveRejectionPayload,
  LeaveCancelPayload,
  LeavesQueryFilters,
} from './types';

export const leaveKeys = {
  all: ['leaves'] as const,
  list: (filters?: LeavesQueryFilters) => [...leaveKeys.all, 'list', filters] as const,
  pending: (approverId?: string) => [...leaveKeys.all, 'pending', approverId] as const,
  detail: (id: string) => [...leaveKeys.all, 'detail', id] as const,
};

export function useLeaves(filters?: LeavesQueryFilters) {
  return useQuery({
    queryKey: leaveKeys.list(filters),
    queryFn: async () => {
      const res = await leavesApi.getAll(filters);
      if (!res.success) throw new Error(res.error);
      return res.data!;
    },
  });
}

export function usePendingLeaves(approverId?: string) {
  return useQuery({
    queryKey: leaveKeys.pending(approverId),
    queryFn: async () => {
      const res = await leavesApi.getPending(approverId);
      if (!res.success) throw new Error(res.error);
      return res.data!;
    },
  });
}

export function useLeave(id: string) {
  return useQuery({
    queryKey: leaveKeys.detail(id),
    queryFn: async () => {
      const res = await leavesApi.getOne(id);
      if (!res.success) throw new Error(res.error);
      return res.data!;
    },
    enabled: !!id,
  });
}

export function useCreateLeave() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (payload: CreateLeavePayload) => leavesApi.apply(payload),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: leaveKeys.all });
      }
    },
  });
}

export function useUpdateLeave() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateLeavePayload }) => 
      leavesApi.update(id, payload),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: leaveKeys.all });
      }
    },
  });
}

export function useApproveLeave() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload?: LeaveApprovalPayload }) => 
      leavesApi.approve(id, payload),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: leaveKeys.all });
      }
    },
  });
}

export function useRejectLeave() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: LeaveRejectionPayload }) => 
      leavesApi.reject(id, payload),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: leaveKeys.all });
      }
    },
  });
}

export function useCancelLeave() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload?: LeaveCancelPayload }) => 
      leavesApi.cancel(id, payload),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: leaveKeys.all });
      }
    },
  });
}

export function useDeleteLeave() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => leavesApi.delete(id),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: leaveKeys.all });
      }
    },
  });
}
