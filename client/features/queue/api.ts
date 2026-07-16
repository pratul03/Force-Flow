import { apiClient, buildQuery } from '@/lib/api-client';
import * as types from '@/lib/types'; // Using generic types for now

export const queueApi = {
  enqueue: (data: unknown) => apiClient.post('/queue/jobs', data),
  list: (limit?: number, status?: string) =>
    apiClient.get(`/queue/jobs${buildQuery({ limit, status })}`),
  process: () => apiClient.post('/queue/jobs/process'),
};
