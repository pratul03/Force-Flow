import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { departmentsApi } from './api';
import { CreateDepartmentPayload, UpdateDepartmentPayload } from './types';

export const departmentKeys = {
  all: ['departments'] as const,
  list: (orgId?: string) => [...departmentKeys.all, 'list', orgId] as const,
  detail: (id: string) => [...departmentKeys.all, 'detail', id] as const,
};

export function useDepartments(organizationId?: string) {
  return useQuery({
    queryKey: departmentKeys.list(organizationId),
    queryFn: async () => {
      const res = await departmentsApi.getAll(organizationId);
      if (!res.success) throw new Error(res.error);
      return res.data!;
    },
    enabled: !!organizationId,
  });
}

export function useDepartment(id: string) {
  return useQuery({
    queryKey: departmentKeys.detail(id),
    queryFn: async () => {
      const res = await departmentsApi.getById(id);
      if (!res.success) throw new Error(res.error);
      return res.data!;
    },
    enabled: !!id,
  });
}

export function useCreateDepartment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (payload: CreateDepartmentPayload) => departmentsApi.create(payload),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: departmentKeys.all });
      }
    },
  });
}

export function useUpdateDepartment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateDepartmentPayload }) => 
      departmentsApi.update(id, payload),
    onSuccess: (res, variables) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: departmentKeys.all });
        queryClient.invalidateQueries({ queryKey: departmentKeys.detail(variables.id) });
      }
    },
  });
}

export function useDeleteDepartment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => departmentsApi.delete(id),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: departmentKeys.all });
      }
    },
  });
}
