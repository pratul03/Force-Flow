import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeesApi } from './api';
import { CreateEmployeePayload, UpdateEmployeePayload } from './types';
import { mapBackendUserToEmployee } from './utils';

export const employeeKeys = {
  all: ['employees'] as const,
  list: () => [...employeeKeys.all, 'list'] as const,
  detail: (id: string) => [...employeeKeys.all, 'detail', id] as const,
};

export function useEmployees() {
  return useQuery({
    queryKey: employeeKeys.list(),
    queryFn: async () => {
      const res = await employeesApi.getAll();
      if (!res.success) throw new Error(res.error);
      return res.data!.map(mapBackendUserToEmployee);
    },
  });
}

export function useEmployee(id: string) {
  return useQuery({
    queryKey: employeeKeys.detail(id),
    queryFn: async () => {
      const res = await employeesApi.getById(id);
      if (!res.success) throw new Error(res.error);
      return mapBackendUserToEmployee(res.data!);
    },
    enabled: !!id,
    staleTime: 0,
    refetchOnMount: 'always',
  });
}

export function useCreateEmployee() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (payload: CreateEmployeePayload) => employeesApi.create(payload),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: employeeKeys.all });
      }
    },
  });
}

export function useUpdateEmployee() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateEmployeePayload }) => 
      employeesApi.update(id, payload),
    onSuccess: (res, variables) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: employeeKeys.all });
        queryClient.invalidateQueries({ queryKey: employeeKeys.detail(variables.id) });
      }
    },
  });
}

export function useDeleteEmployee() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => employeesApi.delete(id),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: employeeKeys.all });
      }
    },
  });
}
