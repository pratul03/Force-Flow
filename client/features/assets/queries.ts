import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { assetsApi } from './api';
import { BackendAsset, CreateAssetPayload, AssignAssetPayload } from './types';
import { toast } from 'sonner';

export const assetKeys = {
  all: ['assets'] as const,
  lists: () => [...assetKeys.all, 'list'] as const,
  list: (filters: string) => [...assetKeys.lists(), { filters }] as const,
  details: () => [...assetKeys.all, 'detail'] as const,
  detail: (id: string) => [...assetKeys.details(), id] as const,
  status: (orgId?: string) => [...assetKeys.all, 'status', orgId] as const,
};

export function useAssets(params?: { organizationId?: string; status?: string; assignedToUserId?: string }) {
  return useQuery({
    queryKey: assetKeys.list(JSON.stringify(params)),
    queryFn: async () => {
      const res = await assetsApi.list(params);
      if (!res.success) throw new Error(res.error || 'Failed to fetch assets');
      return res.data as BackendAsset[];
    },
  });
}

export function useAssetStatus(organizationId?: string) {
  return useQuery({
    queryKey: assetKeys.status(organizationId),
    queryFn: async () => {
      const res = await assetsApi.status(organizationId);
      if (!res.success) throw new Error(res.error || 'Failed to fetch asset status');
      return res.data;
    },
  });
}

export function useCreateAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateAssetPayload) => {
      const res = await assetsApi.create(data);
      if (!res.success) throw new Error(res.error || 'Failed to create asset');
      return res.data as BackendAsset;
    },
    onSuccess: () => {
      toast.success('Asset created successfully');
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
      queryClient.invalidateQueries({ queryKey: assetKeys.status() });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to create asset');
    },
  });
}

export function useAssignAsset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: AssignAssetPayload }) => {
      const res = await assetsApi.assign(id, data);
      if (!res.success) throw new Error(res.error || 'Failed to assign asset');
      return res.data as BackendAsset;
    },
    onSuccess: (_, variables) => {
      toast.success('Asset assigned successfully');
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
      queryClient.invalidateQueries({ queryKey: assetKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: assetKeys.status() });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Failed to assign asset');
    },
  });
}
