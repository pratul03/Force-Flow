import { apiClient, buildQuery } from '@/lib/api-client';
import * as types from '@/lib/types'; // Using generic types for now

export const performanceApi = {
  status: (organizationId?: string) =>
    apiClient.get(`/performance/status${buildQuery({ organizationId })}`),
  reviews: (params?: { organizationId?: string; userId?: string; month?: number; year?: number }) =>
    apiClient.get(`/performance/reviews${buildQuery(params || {})}`),
  upsertReview: (data: unknown) => apiClient.post('/performance/reviews', data),
  reviewCycle: (data: unknown) => apiClient.post('/performance/review-cycle', data),
};
