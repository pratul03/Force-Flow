import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { holidaysApi } from './api';
import { BackendHoliday, CreateHolidayPayload, UpdateHolidayPayload } from './types';
import { toast } from 'sonner';

export const holidayKeys = {
  all: ['holidays'] as const,
  lists: () => [...holidayKeys.all, 'list'] as const,
  list: (params: string) => [...holidayKeys.lists(), { params }] as const,
  details: () => [...holidayKeys.all, 'detail'] as const,
  detail: (id: string) => [...holidayKeys.details(), id] as const,
};

export function useHolidays(params?: { organizationId?: string; year?: number }) {
  return useQuery({
    queryKey: holidayKeys.list(JSON.stringify(params || {})),
    queryFn: async () => {
      const res = await holidaysApi.list(params);
      if (!res.success) throw new Error(res.error || 'Failed to fetch holidays');
      return res.data as BackendHoliday[];
    },
  });
}

export function useHoliday(id: string) {
  return useQuery({
    queryKey: holidayKeys.detail(id),
    queryFn: async () => {
      const res = await holidaysApi.getById(id);
      if (!res.success) throw new Error(res.error || 'Failed to fetch holiday');
      return res.data as BackendHoliday;
    },
    enabled: !!id,
  });
}

export function useCreateHoliday() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateHolidayPayload) => {
      const res = await holidaysApi.create(data);
      if (!res.success) throw new Error(res.error || 'Failed to create holiday');
      return res.data as BackendHoliday;
    },
    onSuccess: () => {
      toast.success('Holiday created successfully');
      queryClient.invalidateQueries({ queryKey: holidayKeys.lists() });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to create holiday');
    },
  });
}

export function useUpdateHoliday() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateHolidayPayload }) => {
      const res = await holidaysApi.update(id, data);
      if (!res.success) throw new Error(res.error || 'Failed to update holiday');
      return res.data as BackendHoliday;
    },
    onSuccess: (_, variables) => {
      toast.success('Holiday updated successfully');
      queryClient.invalidateQueries({ queryKey: holidayKeys.lists() });
      queryClient.invalidateQueries({ queryKey: holidayKeys.detail(variables.id) });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update holiday');
    },
  });
}

export function useDeleteHoliday() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await holidaysApi.delete(id);
      if (!res.success) throw new Error(res.error || 'Failed to delete holiday');
      return true;
    },
    onSuccess: () => {
      toast.success('Holiday deleted successfully');
      queryClient.invalidateQueries({ queryKey: holidayKeys.lists() });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete holiday');
    },
  });
}
