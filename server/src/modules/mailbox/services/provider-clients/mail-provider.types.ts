import { MailProvider } from '@prisma/client';

export type MailProviderKey = 'gmail' | 'outlook';
export type MailFolder = 'INBOX' | 'SENT' | 'DRAFT' | 'ARCHIVE';

export interface MailAttachmentMeta {
  id: string;
  name: string;
  size: number;
  type: string;
}

export interface MailMessage {
  id: string;
  provider: MailProviderKey;
  from: string;
  to: string[];
  subject: string;
  body: string;
  preview: string;
  receivedAt: string;
  isRead: boolean;
  folder: MailFolder;
  hasAttachments: boolean;
  attachments: MailAttachmentMeta[];
}

export interface MailProviderConnectionStatus {
  provider: MailProviderKey;
  connected: boolean;
  connectedAt: string | null;
  accountEmail: string | null;
  accessToken: null;
  refreshToken: null;
  tokenType: null;
  expiresAt: string | null;
  clientIdConfigured: boolean;
}

export interface MailOAuthSessionData {
  state: string;
  codeVerifier: string;
  redirectUri: string;
  expiresAt: Date;
}

export interface MailOAuthStartResult {
  authUrl: string;
  state: string;
  expiresAt: string;
}

export interface ProviderTokenPayload {
  accessToken: string;
  refreshToken?: string;
  tokenType?: string;
  expiresIn?: number;
}

export interface SendMailAttachmentInput {
  id: string;
  name: string;
  type: string;
  contentBase64: string;
}

export interface SendMailPayload {
  to: string;
  subject: string;
  body: string;
  attachments: SendMailAttachmentInput[];
}

export interface StartOAuthInput {
  state: string;
  codeChallenge: string;
  redirectUri: string;
}

export interface MailProviderClient {
  readonly provider: MailProvider;
  isConfigured(): boolean;
  startOAuth(input: StartOAuthInput): MailOAuthStartResult;
  exchangeAuthorizationCode(input: {
    code: string;
    codeVerifier: string;
    redirectUri: string;
  }): Promise<ProviderTokenPayload>;
  refreshAccessToken(input: { refreshToken: string }): Promise<ProviderTokenPayload>;
  fetchAccountEmail(accessToken: string): Promise<string>;
  fetchMessages(accessToken: string): Promise<MailMessage[]>;
  markMessageAsRead(accessToken: string, messageId: string): Promise<void>;
  sendMessage(input: {
    accessToken: string;
    fromEmail: string;
    payload: SendMailPayload;
  }): Promise<{ id?: string }>;
}
