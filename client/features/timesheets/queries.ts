import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { timesheetsApi } from './api';
import { CreateTimeLogPayload, UpdateTimeLogPayload, mapBackendTimelogToUi } from './types';

export const timesheetKeys = {
  all: ['timesheets'] as const,
  list: (userId?: string) => [...timesheetKeys.all, 'list', userId] as const,
  detail: (id: string) => [...timesheetKeys.all, 'detail', id] as const,
};

export function useTimesheets(userId?: string) {
  return useQuery({
    queryKey: timesheetKeys.list(userId),
    queryFn: async () => {
      const res = await timesheetsApi.getAll(userId);
      if (!res.success) throw new Error(res.error);
      return res.data!.map(mapBackendTimelogToUi);
    },
  });
}

export function useTimesheet(id: string) {
  return useQuery({
    queryKey: timesheetKeys.detail(id),
    queryFn: async () => {
      const res = await timesheetsApi.getById(id);
      if (!res.success) throw new Error(res.error);
      return mapBackendTimelogToUi(res.data!);
    },
    enabled: !!id,
  });
}

export function useCreateTimesheet() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (payload: CreateTimeLogPayload) => timesheetsApi.create(payload),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: timesheetKeys.all });
      }
    },
  });
}

export function useUpdateTimesheet() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateTimeLogPayload }) => 
      timesheetsApi.update(id, payload),
    onSuccess: (res, variables) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: timesheetKeys.all });
        queryClient.invalidateQueries({ queryKey: timesheetKeys.detail(variables.id) });
      }
    },
  });
}

export function useDeleteTimesheet() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => timesheetsApi.delete(id),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: timesheetKeys.all });
      }
    },
  });
}
