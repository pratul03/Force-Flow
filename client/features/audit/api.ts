import { apiClient, buildQuery } from '@/lib/api-client';
import * as types from '@/lib/types'; // Using generic types for now

export const auditApi = {
  recentActivity: () => apiClient.get('/audit/recent-activity'),
};
