export type SubscriptionInterval = 'MONTHLY' | 'YEARLY';
export type BillingProvider = 'STRIPE' | 'LEMON_SQUEEZY' | 'PADDLE' | 'MANUAL';
export type OrganizationSubscriptionStatus =
  | 'TRIALING'
  | 'ACTIVE'
  | 'PAST_DUE'
  | 'CANCELED'
  | 'UNPAID';

export interface BackendSubscriptionPlan {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  price: number;
  currency: string;
  interval: SubscriptionInterval;
  trialDays: number;
  employeeLimit?: number | null;
  features?: unknown;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface BackendOrganizationSubscription {
  id: string;
  organizationId: string;
  planId: string;
  provider: BillingProvider;
  status: OrganizationSubscriptionStatus;
  providerCustomerId?: string | null;
  providerSubscriptionId?: string | null;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialStart?: string | null;
  trialEnd?: string | null;
  canceledAt?: string | null;
  metadata?: unknown;
  createdByUserId?: string | null;
  createdAt: string;
  updatedAt: string;
  plan?: BackendSubscriptionPlan;
}

export interface BackendSubscriptionCheckoutSessionResponse {
  sessionToken: string;
  checkoutUrl: string;
  expiresAt: string;
  provider: BillingProvider;
  plan: BackendSubscriptionPlan;
}
