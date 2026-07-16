import { apiClient, buildQuery } from '@/lib/api-client';
import * as types from '@/lib/types'; // Using generic types for now

export const walletsApi = {
  getUserWallet: (userId: string) => apiClient.get(`/wallets/user/${userId}`),
  bootstrap: (userId: string, currency?: string) =>
    apiClient.post(`/wallets/user/${userId}/bootstrap${buildQuery({ currency })}`),
  transactions: (userId?: string) =>
    apiClient.get(`/wallets/transactions${buildQuery({ userId })}`),
  createTransaction: (data: unknown) => apiClient.post('/wallets/transactions', data),
  requestWithdrawal: (data: unknown) => apiClient.post('/wallets/withdrawals', data),
  retryWithdrawal: (transactionId: string) =>
    apiClient.post(`/wallets/withdrawals/${transactionId}/retry`),
};
