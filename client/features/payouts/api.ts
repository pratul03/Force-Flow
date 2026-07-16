import { apiClient, buildQuery } from '@/lib/api-client';
import * as types from '@/lib/types'; // Using generic types for now

export const payoutsApi = {
  razorpay: (data: unknown) => apiClient.post('/razorpay/payout', data),
};
