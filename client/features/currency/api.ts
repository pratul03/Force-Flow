import { apiClient, buildQuery } from '@/lib/api-client';
import * as types from '@/lib/types'; // Using generic types for now

export const currencyApi = {
  rates: (baseCurrency?: string) => apiClient.get(`/currency/rates${buildQuery({ baseCurrency })}`),
  history: (params?: { from?: string; to?: string; limit?: number }) =>
    apiClient.get(`/currency/history${buildQuery(params || {})}`),
  convert: (data: unknown) => apiClient.post('/currency/convert', data),
  sync: (source?: string) => apiClient.post('/currency/sync', { source }),
};
