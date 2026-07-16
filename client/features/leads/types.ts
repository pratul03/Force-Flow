import { LeadStatus } from '@/lib/types';
import { BackendQuotation } from '@/lib/types'; // Assuming it's there

export interface BackendLead {
  id: string;
  organizationId: string;
  createdById?: string | null;
  name: string;
  company: string;
  email: string;
  phone?: string | null;
  source?: string | null;
  notes?: string | null;
  status: LeadStatus;
  expectedAmount?: number | null;
  currency: string;
  createdAt: string;
  updatedAt: string;
  quotations?: BackendQuotation[];
}

export interface CreateLeadPayload {
  organizationId: string;
  name: string;
  company: string;
  email: string;
  phone?: string;
  source?: string;
  expectedAmount?: number;
  currency?: string;
}

export interface UpdateLeadPayload {
  status?: LeadStatus;
  name?: string;
  company?: string;
  email?: string;
  phone?: string;
  source?: string;
  expectedAmount?: number;
  currency?: string;
  notes?: string;
}
export { LeadStatus };

