export type MailProvider = 'gmail' | 'outlook';
export type MailFolder = 'INBOX' | 'SENT' | 'DRAFT' | 'ARCHIVE';
export type MailReadFilter = 'all' | 'read' | 'unread';
export type MailAttachmentFilter = 'all' | 'with_attachments';
export type MailSortOption = 'newest' | 'oldest' | 'unread_first';

export interface MailAttachmentMeta {
  id: string;
  name: string;
  size: number;
  type: string;
}

export interface MailDraftAttachment extends MailAttachmentMeta {
  contentBase64: string;
}

export interface MailMessage {
  id: string;
  provider: MailProvider;
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

export interface MailProviderConnection {
  provider: MailProvider;
  connected: boolean;
  connectedAt: string | null;
  accountEmail: string | null;
  accessToken: string | null;
  refreshToken: string | null;
  tokenType: string | null;
  expiresAt: string | null;
  clientIdConfigured: boolean;
}

export interface MailComposePayload {
  provider: MailProvider;
  to: string;
  subject: string;
  body: string;
  attachments: MailDraftAttachment[];
}
