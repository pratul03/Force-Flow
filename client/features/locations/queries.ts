import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { locationsApi } from './api';
import { BackendLocation, CreateLocationPayload, UpdateLocationPayload } from './types';
import { toast } from 'sonner';

export const locationKeys = {
  all: ['locations'] as const,
  lists: () => [...locationKeys.all, 'list'] as const,
  list: (params: string) => [...locationKeys.lists(), { params }] as const,
  details: () => [...locationKeys.all, 'detail'] as const,
  detail: (id: string) => [...locationKeys.details(), id] as const,
};

export function useLocations(params?: { organizationId?: string }) {
  return useQuery({
    queryKey: locationKeys.list(JSON.stringify(params || {})),
    queryFn: async () => {
      const res = await locationsApi.list(params);
      if (!res.success) throw new Error(res.error || 'Failed to fetch locations');
      return res.data as BackendLocation[];
    },
  });
}

export function useLocation(id: string) {
  return useQuery({
    queryKey: locationKeys.detail(id),
    queryFn: async () => {
      const res = await locationsApi.getById(id);
      if (!res.success) throw new Error(res.error || 'Failed to fetch location');
      return res.data as BackendLocation;
    },
    enabled: !!id,
  });
}

export function useCreateLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateLocationPayload) => {
      const res = await locationsApi.create(data);
      if (!res.success) throw new Error(res.error || 'Failed to create location');
      return res.data as BackendLocation;
    },
    onSuccess: () => {
      toast.success('Location created successfully');
      queryClient.invalidateQueries({ queryKey: locationKeys.lists() });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to create location');
    },
  });
}

export function useUpdateLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateLocationPayload }) => {
      const res = await locationsApi.update(id, data);
      if (!res.success) throw new Error(res.error || 'Failed to update location');
      return res.data as BackendLocation;
    },
    onSuccess: (_, variables) => {
      toast.success('Location updated successfully');
      queryClient.invalidateQueries({ queryKey: locationKeys.lists() });
      queryClient.invalidateQueries({ queryKey: locationKeys.detail(variables.id) });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to update location');
    },
  });
}

export function useDeleteLocation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await locationsApi.delete(id);
      if (!res.success) throw new Error(res.error || 'Failed to delete location');
      return true;
    },
    onSuccess: () => {
      toast.success('Location deleted successfully');
      queryClient.invalidateQueries({ queryKey: locationKeys.lists() });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to delete location');
    },
  });
}
