import { apiClient, buildQuery } from '@/lib/api-client';
import * as types from '@/lib/types'; // Using generic types for now

export const i18nApi = {
  locales: () => apiClient.get('/i18n/locales'),
  detect: (acceptLanguage?: string) =>
    apiClient.get(`/i18n/detect${buildQuery({ acceptLanguage })}`),
};
