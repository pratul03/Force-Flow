import { apiClient, buildQuery } from '@/lib/api-client';
import * as types from '@/lib/types'; // Using generic types for now

export const schedulerApi = {
  nightly: (organizationId?: string) => apiClient.post('/scheduler/nightly', { organizationId }),
  payroll: (data: unknown) => apiClient.post('/scheduler/payroll', data),
  jobs: (types?: string[]) => apiClient.post('/scheduler/jobs', { types }),
};
