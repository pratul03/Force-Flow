import { apiClient } from "@/lib/api-client";
import {
  BackendOrganizationSubscription,
  BackendSubscriptionCheckoutSessionResponse,
  BackendSubscriptionPlan,
  BillingProvider,
} from "./types";

export const subscriptionsApi = {
  listPlans: () => apiClient.get<BackendSubscriptionPlan[]>('/subscriptions/plans'),
  current: () => apiClient.get<BackendOrganizationSubscription>('/subscriptions/current'),
  createCheckoutSession: (data: {
    planCode: string;
    provider?: BillingProvider;
    successUrl?: string;
    cancelUrl?: string;
  }) =>
    apiClient.post<BackendSubscriptionCheckoutSessionResponse>(
      '/subscriptions/checkout-sessions',
      data,
    ),
  completeCheckoutSession: (token: string) =>
    apiClient.post<{
      subscription: BackendOrganizationSubscription;
      session: {
        id: string;
        status: string;
        completedAt?: string | null;
      };
    }>(`/subscriptions/checkout-sessions/${token}/complete`),
};
