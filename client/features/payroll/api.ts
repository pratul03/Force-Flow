import { apiClient, buildQuery } from '@/lib/api-client';
import * as types from '@/lib/types'; // Using generic types for now

export const payrollApi = {
  preview: (userId: string, month?: number, year?: number) =>
    apiClient.get(`/payroll/preview/${userId}${buildQuery({ month, year })}`),
  generate: (data: unknown) => apiClient.post('/payroll/generate', data),
  invoices: (params?: { userId?: string; month?: number; year?: number; status?: string }) =>
    apiClient.get(
      `/payroll/invoices${buildQuery({
        userId: params?.userId,
        month: params?.month,
        year: params?.year,
        status: params?.status,
      })}`,
    ),
  invoice: (id: string) => apiClient.get(`/payroll/invoices/${id}`),
  renderInvoice: (id: string) => apiClient.get(`/payroll/invoices/${id}/render`),
  invoicePdfUrl: (id: string) => `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/payroll/invoices/${id}/pdf`,
  markPaid: (id: string, paymentReference: string) =>
    apiClient.patch(`/payroll/invoices/${id}/paid`, { paymentReference }),
};
