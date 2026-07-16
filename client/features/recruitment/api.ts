import { apiClient, buildQuery } from '@/lib/api-client';
import * as types from '@/lib/types'; // Using generic types for now

export const recruitmentApi = {
  status: (organizationId?: string) =>
    apiClient.get(`/recruitment/status${buildQuery({ organizationId })}`),
  candidates: (params?: { organizationId?: string; stage?: string; limit?: number }) =>
    apiClient.get(`/recruitment/candidates${buildQuery(params || {})}`),
  createCandidate: (data: unknown) => apiClient.post('/recruitment/candidates', data),
  updateCandidateStage: (id: string, data: unknown) =>
    apiClient.patch(`/recruitment/candidates/${id}/stage`, data),
  scoreApplications: (data: unknown) => apiClient.post('/recruitment/score-applications', data),
};
