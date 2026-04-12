import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailProvider } from '@prisma/client';
import {
  MailAttachmentMeta,
  MailMessage,
  MailOAuthStartResult,
  MailProviderClient,
  ProviderTokenPayload,
  SendMailPayload,
  StartOAuthInput,
} from './mail-provider.types';
import {
  createPreview,
  fromBase64UrlToUtf8,
  normalizeBase64,
  parseCommaSeparatedEmails,
  stripHtml,
  toBase64UrlUtf8,
  wrapBase64Lines,
} from './provider-client.utils';

type GmailPayloadNode = {
  mimeType?: string;
  filename?: string;
  body?: { data?: string; size?: number };
  parts?: GmailPayloadNode[];
};

@Injectable()
export class GmailProviderClient implements MailProviderClient {
  readonly provider = MailProvider.GMAIL;

  constructor(private readonly configService: ConfigService) {}

  isConfigured(): boolean {
    return !!this.getClientId() && !!this.getClientSecret();
  }

  startOAuth(input: StartOAuthInput): MailOAuthStartResult {
    const params = new URLSearchParams({
      client_id: this.getClientId(),
      redirect_uri: input.redirectUri,
      response_type: 'code',
      state: input.state,
      code_challenge: input.codeChallenge,
      code_challenge_method: 'S256',
      scope: this.getScopes().join(' '),
      access_type: 'offline',
      include_granted_scopes: 'true',
      prompt: 'consent',
    });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

    return {
      authUrl,
      state: input.state,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    };
  }

  async exchangeAuthorizationCode(input: {
    code: string;
    codeVerifier: string;
    redirectUri: string;
  }): Promise<ProviderTokenPayload> {
    const body = new URLSearchParams({
      code: input.code,
      client_id: this.getClientId(),
      client_secret: this.getClientSecret(),
      redirect_uri: input.redirectUri,
      grant_type: 'authorization_code',
      code_verifier: input.codeVerifier,
    });

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!response.ok) {
      throw new BadRequestException('Google token exchange failed');
    }

    const payload = (await response.json()) as {
      access_token: string;
      refresh_token?: string;
      token_type?: string;
      expires_in?: number;
    };

    return {
      accessToken: payload.access_token,
      refreshToken: payload.refresh_token,
      tokenType: payload.token_type,
      expiresIn: payload.expires_in,
    };
  }

  async refreshAccessToken(input: { refreshToken: string }): Promise<ProviderTokenPayload> {
    const body = new URLSearchParams({
      client_id: this.getClientId(),
      client_secret: this.getClientSecret(),
      refresh_token: input.refreshToken,
      grant_type: 'refresh_token',
    });

    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!response.ok) {
      throw new UnauthorizedException('Google access token refresh failed');
    }

    const payload = (await response.json()) as {
      access_token: string;
      refresh_token?: string;
      token_type?: string;
      expires_in?: number;
    };

    return {
      accessToken: payload.access_token,
      refreshToken: payload.refresh_token,
      tokenType: payload.token_type,
      expiresIn: payload.expires_in,
    };
  }

  async fetchAccountEmail(accessToken: string): Promise<string> {
    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new BadRequestException('Unable to fetch Gmail profile');
    }

    const payload = (await response.json()) as { emailAddress?: string };
    if (!payload.emailAddress) {
      throw new BadRequestException('Gmail account email unavailable');
    }

    return payload.emailAddress;
  }

  async fetchMessages(accessToken: string): Promise<MailMessage[]> {
    const listResponse = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=30&q=in:anywhere%20-in:draft',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    if (listResponse.status === 401) {
      throw new UnauthorizedException('Google access token expired');
    }

    if (!listResponse.ok) {
      throw new BadRequestException('Unable to fetch Gmail messages list');
    }

    const listPayload = (await listResponse.json()) as {
      messages?: Array<{ id: string }>;
    };

    const messageRefs = listPayload.messages || [];
    const messages: Array<MailMessage | null> = await Promise.all(
      messageRefs.slice(0, 20).map(async (messageRef) => {
        const detailResponse = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageRef.id}?format=full`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          },
        );

        if (!detailResponse.ok) {
          return null;
        }

        const detail = (await detailResponse.json()) as {
          id: string;
          internalDate?: string;
          labelIds?: string[];
          payload?: {
            headers?: Array<{ name?: string; value?: string }>;
          } & GmailPayloadNode;
        };

        const parsed = this.parseParts(detail.payload);
        const subject = this.getHeader(detail.payload?.headers, 'Subject') || '(no subject)';
        const from = this.getHeader(detail.payload?.headers, 'From') || 'Unknown sender';
        const toRaw = this.getHeader(detail.payload?.headers, 'To');
        const receivedAt = detail.internalDate
          ? new Date(Number(detail.internalDate)).toISOString()
          : new Date().toISOString();
        const isSent = detail.labelIds?.includes('SENT') || false;

        const body = parsed.body || stripHtml(this.getHeader(detail.payload?.headers, 'Snippet'));

        return {
          id: detail.id,
          provider: 'gmail',
          from,
          to: parseCommaSeparatedEmails(toRaw),
          subject,
          body,
          preview: createPreview(body),
          receivedAt,
          isRead: !(detail.labelIds || []).includes('UNREAD'),
          folder: isSent ? 'SENT' : 'INBOX',
          hasAttachments: parsed.attachments.length > 0,
          attachments: parsed.attachments,
        };
      }),
    );

    return messages.filter((message): message is MailMessage => message !== null);
  }

  async markMessageAsRead(accessToken: string, messageId: string): Promise<void> {
    const response = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          removeLabelIds: ['UNREAD'],
        }),
      },
    );

    if (response.status === 401) {
      throw new UnauthorizedException('Google access token expired');
    }

    if (!response.ok) {
      throw new BadRequestException('Unable to mark Gmail message as read');
    }
  }

  async sendMessage(input: {
    accessToken: string;
    fromEmail: string;
    payload: SendMailPayload;
  }): Promise<{ id?: string }> {
    const raw = this.buildMimeMessage(input.payload, input.fromEmail);

    const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${input.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw }),
    });

    if (response.status === 401) {
      throw new UnauthorizedException('Google access token expired');
    }

    if (!response.ok) {
      throw new BadRequestException('Gmail send failed');
    }

    return (await response.json()) as { id?: string };
  }

  private buildMimeMessage(payload: SendMailPayload, fromEmail: string): string {
    const boundary = `flowforce_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const recipients = parseCommaSeparatedEmails(payload.to).join(', ');
    const headerLines = [
      `From: ${fromEmail}`,
      `To: ${recipients}`,
      `Subject: ${payload.subject}`,
      'MIME-Version: 1.0',
    ];

    if (payload.attachments.length === 0) {
      const textMessage = [
        ...headerLines,
        'Content-Type: text/plain; charset=UTF-8',
        '',
        payload.body,
      ].join('\r\n');

      return toBase64UrlUtf8(textMessage);
    }

    const parts: string[] = [];
    parts.push(...headerLines);
    parts.push(`Content-Type: multipart/mixed; boundary="${boundary}"`);
    parts.push('');

    parts.push(`--${boundary}`);
    parts.push('Content-Type: text/plain; charset=UTF-8');
    parts.push('');
    parts.push(payload.body);
    parts.push('');

    payload.attachments.forEach((attachment) => {
      parts.push(`--${boundary}`);
      parts.push(`Content-Type: ${attachment.type || 'application/octet-stream'}; name="${attachment.name}"`);
      parts.push('Content-Transfer-Encoding: base64');
      parts.push(`Content-Disposition: attachment; filename="${attachment.name}"`);
      parts.push('');
      parts.push(wrapBase64Lines(normalizeBase64(attachment.contentBase64)));
      parts.push('');
    });

    parts.push(`--${boundary}--`);

    return toBase64UrlUtf8(parts.join('\r\n'));
  }

  private getHeader(
    headers: Array<{ name?: string; value?: string }> | undefined,
    name: string,
  ): string {
    const item = headers?.find(
      (header) => (header.name || '').toLowerCase() === name.toLowerCase(),
    );
    return item?.value || '';
  }

  private parseParts(
    part: GmailPayloadNode | undefined,
  ): { body: string; attachments: MailAttachmentMeta[] } {
    if (!part) {
      return { body: '', attachments: [] };
    }

    const attachments: MailAttachmentMeta[] = [];
    let preferredText = '';

    const walk = (node: GmailPayloadNode) => {
      const mimeType = node.mimeType || '';
      const filename = node.filename || '';
      const data = node.body?.data;

      if (filename) {
        attachments.push({
          id: `${filename}_${attachments.length}_${Date.now()}`,
          name: filename,
          size: node.body?.size || 0,
          type: mimeType || 'application/octet-stream',
        });
      }

      if (!preferredText && data && mimeType.includes('text/plain')) {
        preferredText = fromBase64UrlToUtf8(data);
      }

      if (!preferredText && data && mimeType.includes('text/html')) {
        preferredText = stripHtml(fromBase64UrlToUtf8(data));
      }

      if (Array.isArray(node.parts)) {
        node.parts.forEach((child) => walk(child));
      }
    };

    walk(part);

    if (!preferredText && part.body?.data) {
      preferredText = fromBase64UrlToUtf8(part.body.data);
    }

    return {
      body: preferredText,
      attachments,
    };
  }

  private getScopes(): string[] {
    return [
      'openid',
      'profile',
      'email',
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.send',
    ];
  }

  private getClientId(): string {
    return this.configService.get<string>('MAIL_GOOGLE_CLIENT_ID') || '';
  }

  private getClientSecret(): string {
    return this.configService.get<string>('MAIL_GOOGLE_CLIENT_SECRET') || '';
  }
}
