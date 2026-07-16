export type QuotationStatus =
  | 'DRAFT'
  | 'SENT'
  | 'VIEWED'
  | 'APPROVED'
  | 'REJECTED'
  | 'EXPIRED';

export interface QuotationLineItem {
  id?: string;
  title: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  taxPercent?: number;
  discountPercent?: number;
  lineTotal?: number;
  total?: number;
}

export interface QuotationDesigner {
  themeColor: string;
  logoUrl?: string;
  companyInfo: string;
  companyDisplayName?: string;
  notes?: string;
  terms?: string;
}

export interface BackendQuotationStatusEvent {
  id: string;
  quotationId: string;
  status: QuotationStatus;
  actorType: 'USER' | 'CLIENT' | 'SYSTEM';
  actorId?: string;
  actorName?: string;
  metadata?: unknown;
  createdAt: string;
}

export interface BackendLead {
  id: string;
  name: string;
  title: string;
}

export interface BackendQuotation {
  id: string;
  organizationId: string;
  leadId: string;
  quoteNumber: string;
  publicToken: string;
  title: string;
  description: string;
  amount: number;
  currency: string;
  taxPercent: number;
  discountPercent: number;
  totalAmount: number;
  validUntil?: string | null;
  status: QuotationStatus;
  sentAt?: string | null;
  respondedAt?: string | null;
  approvedAt?: string | null;
  rejectedAt?: string | null;
  approvalNote?: string | null;
  rejectionNote?: string | null;
  lineItems?: QuotationLineItem[] | null;
  designer?: QuotationDesigner | null;
  createdById: string;
  updatedById?: string | null;
  createdAt: string;
  updatedAt: string;
  lead?: BackendLead;
  events?: BackendQuotationStatusEvent[];
}
