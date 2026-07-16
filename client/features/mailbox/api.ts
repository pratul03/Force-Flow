import { apiClient } from "@/lib/api-client";
import { MailComposePayload, MailMessage, MailProvider, MailProviderConnection } from "./types";

export const mailboxApi = {
  getProviderStatus: () =>
    apiClient.get<{ providers: Record<MailProvider, MailProviderConnection> }>(
      '/mailbox/providers/status',
    ),
  startConnect: (provider: MailProvider) =>
    apiClient.post<{ authUrl: string; state: string; expiresAt: string }>(
      `/mailbox/providers/${provider}/connect`,
    ),
  completeOAuth: (code: string, state: string) =>
    apiClient.post<{
      provider: MailProvider;
      connection: MailProviderConnection;
    }>('/mailbox/providers/oauth/complete', {
      code,
      state,
    }),
  disconnectProvider: (provider: MailProvider) =>
    apiClient.delete<{ disconnected: boolean; provider: MailProvider }>(
      `/mailbox/providers/${provider}`,
    ),
  syncProvider: (provider: MailProvider) =>
    apiClient.post<{ provider: MailProvider; messages: MailMessage[] }>(
      `/mailbox/providers/${provider}/sync`,
    ),
  markAsRead: (provider: MailProvider, messageId: string) =>
    apiClient.post<{ updated: boolean }>(
      `/mailbox/providers/${provider}/messages/${messageId}/read`,
    ),
  sendEmail: (provider: MailProvider, payload: MailComposePayload) =>
    apiClient.post<{ sent: boolean; providerMessageId?: string }>(
      `/mailbox/providers/${provider}/send`,
      {
        to: payload.to,
        subject: payload.subject,
        body: payload.body,
        attachments: payload.attachments,
      },
    ),
};
