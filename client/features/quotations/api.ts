import { apiClient, buildQuery } from "@/lib/api-client";
import {
  BackendQuotation,
  QuotationDesigner,
  QuotationLineItem,
  QuotationStatus,
} from "./types";

export const quotationsApi = {
  list: (params?: {
    organizationId?: string;
    leadId?: string;
    status?: QuotationStatus;
    limit?: number;
  }) => apiClient.get<BackendQuotation[]>(`/quotations${buildQuery(params || {})}`),
  getById: (id: string) => apiClient.get<BackendQuotation>(`/quotations/${id}`),
  downloadPdf: async (id: string) => {
    const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/quotations/${id}/pdf`;
    const res = await fetch(url, { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to download PDF');
    return res.blob();
  },
  create: (data: {
    organizationId: string;
    leadId: string;
    actorUserId: string;
    title: string;
    description: string;
    amount?: number;
    currency?: string;
    taxPercent?: number;
    discountPercent?: number;
    validUntil?: string;
    lineItems?: QuotationLineItem[];
    designer?: QuotationDesigner;
  }) => apiClient.post<BackendQuotation>('/quotations', data),
  update: (
    id: string,
    data: {
      actorUserId: string;
      title?: string;
      description?: string;
      amount?: number;
      currency?: string;
      taxPercent?: number;
      discountPercent?: number;
      validUntil?: string;
      lineItems?: QuotationLineItem[];
      designer?: QuotationDesigner;
    },
  ) => apiClient.patch<BackendQuotation>(`/quotations/${id}`, data),
  remove: (id: string, actorUserId: string) =>
    apiClient.delete<{ deleted: boolean; id: string }>(
      `/quotations/${id}${buildQuery({ actorUserId })}`,
    ),
  send: (id: string, data: { actorUserId: string; emailMessage?: string }) =>
    apiClient.post<{
      quotation: BackendQuotation;
      publicUrl: string;
    }>(`/quotations/${id}/send`, data),
  manualApprove: (id: string, data: { actorUserId: string; note?: string }) =>
    apiClient.post<BackendQuotation>(`/quotations/${id}/manual-approve`, data),
  manualReject: (id: string, data: { actorUserId: string; note?: string }) =>
    apiClient.post<BackendQuotation>(`/quotations/${id}/manual-reject`, data),
  publicDetails: (token: string) =>
    apiClient.get<BackendQuotation>(`/quotations/public/${token}`),
  publicApprove: (
    token: string,
    data: { clientName?: string; note?: string },
  ) => apiClient.post<BackendQuotation>(`/quotations/public/${token}/approve`, data),
  publicReject: (
    token: string,
    data: { clientName?: string; note?: string },
  ) => apiClient.post<BackendQuotation>(`/quotations/public/${token}/reject`, data),
  publicPdfUrl: (token: string) => `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/quotations/public/${token}/pdf`,
};
