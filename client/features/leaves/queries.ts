import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leavesApi } from './api';
import { CreateLeavePayload, UpdateLeaveStatusPayload } from './types';

export const leaveKeys = {
  all: ['leaves'] as const,
  list: (orgId?: string) => [...leaveKeys.all, 'list', orgId] as const,
  myLeaves: (userId: string) => [...leaveKeys.all, 'my', userId] as const,
};

export function useLeaves(organizationId?: string) {
  return useQuery({
    queryKey: leaveKeys.list(organizationId),
    queryFn: async () => {
      const res = await leavesApi.getAll(organizationId);
      if (!res.success) throw new Error(res.error);
      return res.data!;
    },
    enabled: !!organizationId,
  });
}

export function useMyLeaves(userId?: string) {
  return useQuery({
    queryKey: leaveKeys.myLeaves(userId!),
    queryFn: async () => {
      const res = await leavesApi.getMyLeaves(userId!);
      if (!res.success) throw new Error(res.error);
      return res.data!;
    },
    enabled: !!userId,
  });
}

export function useCreateLeave() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (payload: CreateLeavePayload) => leavesApi.create(payload),
    onSuccess: (res, variables) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: leaveKeys.all });
      }
    },
  });
}

export function useUpdateLeaveStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ leaveId, payload }: { leaveId: string; payload: UpdateLeaveStatusPayload }) => 
      leavesApi.updateStatus(leaveId, payload),
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
    mutationFn: (leaveId: string) => leavesApi.delete(leaveId),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: leaveKeys.all });
      }
    },
  });
}
