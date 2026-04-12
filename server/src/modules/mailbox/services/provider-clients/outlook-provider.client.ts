import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MailProvider } from '@prisma/client';
import {
  MailMessage,
  MailOAuthStartResult,
  MailProviderClient,
  ProviderTokenPayload,
  SendMailPayload,
  StartOAuthInput,
} from './mail-provider.types';
import {
  createPreview,
  normalizeBase64,
  parseCommaSeparatedEmails,
  stripHtml,
} from './provider-client.utils';

@Injectable()
export class OutlookProviderClient implements MailProviderClient {
  readonly provider = MailProvider.OUTLOOK;

  constructor(private readonly configService: ConfigService) {}

  isConfigured(): boolean {
    return !!this.getClientId() && !!this.getClientSecret();
  }

  startOAuth(input: StartOAuthInput): MailOAuthStartResult {
    const params = new URLSearchParams({
      client_id: this.getClientId(),
      redirect_uri: input.redirectUri,
      response_type: 'code',
      response_mode: 'query',
      state: input.state,
      code_challenge: input.codeChallenge,
      code_challenge_method: 'S256',
      scope: this.getScopes().join(' '),
    });

    const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;

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
      scope: this.getScopes().join(' '),
    });

    const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!response.ok) {
      throw new BadRequestException('Microsoft token exchange failed');
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
      scope: this.getScopes().join(' '),
    });

    const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!response.ok) {
      throw new UnauthorizedException('Microsoft access token refresh failed');
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
    const response = await fetch('https://graph.microsoft.com/v1.0/me?$select=mail,userPrincipalName', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new BadRequestException('Unable to fetch Outlook profile');
    }

    const payload = (await response.json()) as {
      mail?: string;
      userPrincipalName?: string;
    };

    const email = payload.mail || payload.userPrincipalName;
    if (!email) {
      throw new BadRequestException('Outlook account email unavailable');
    }

    return email;
  }

  async fetchMessages(accessToken: string): Promise<MailMessage[]> {
    const [inbox, sent] = await Promise.all([
      this.fetchFolderMessages(accessToken, 'INBOX'),
      this.fetchFolderMessages(accessToken, 'SENT'),
    ]);

    return [...inbox, ...sent].sort(
      (a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime(),
    );
  }

  async markMessageAsRead(accessToken: string, messageId: string): Promise<void> {
    const response = await fetch(`https://graph.microsoft.com/v1.0/me/messages/${messageId}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ isRead: true }),
    });

    if (response.status === 401) {
      throw new UnauthorizedException('Microsoft access token expired');
    }

    if (!response.ok) {
      throw new BadRequestException('Unable to mark Outlook message as read');
    }
  }

  async sendMessage(input: {
    accessToken: string;
    fromEmail: string;
    payload: SendMailPayload;
  }): Promise<{ id?: string }> {
    const response = await fetch('https://graph.microsoft.com/v1.0/me/sendMail', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${input.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: {
          subject: input.payload.subject,
          body: {
            contentType: 'Text',
            content: input.payload.body,
          },
          toRecipients: parseCommaSeparatedEmails(input.payload.to).map((email) => ({
            emailAddress: { address: email },
          })),
          attachments: input.payload.attachments.map((attachment) => ({
            '@odata.type': '#microsoft.graph.fileAttachment',
            name: attachment.name,
            contentType: attachment.type,
            contentBytes: normalizeBase64(attachment.contentBase64),
          })),
        },
        saveToSentItems: true,
      }),
    });

    if (response.status === 401) {
      throw new UnauthorizedException('Microsoft access token expired');
    }

    if (!response.ok) {
      throw new BadRequestException('Outlook send failed');
    }

    return {};
  }

  private async fetchFolderMessages(
    accessToken: string,
    folder: 'INBOX' | 'SENT',
  ): Promise<MailMessage[]> {
    const endpoint =
      folder === 'SENT'
        ? 'https://graph.microsoft.com/v1.0/me/mailFolders/sentitems/messages?$top=15&$orderby=sentDateTime%20desc&$select=id,subject,from,toRecipients,bodyPreview,body,sentDateTime,isRead,hasAttachments'
        : 'https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages?$top=25&$orderby=receivedDateTime%20desc&$select=id,subject,from,toRecipients,bodyPreview,body,receivedDateTime,isRead,hasAttachments';

    const response = await fetch(endpoint, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (response.status === 401) {
      throw new UnauthorizedException('Microsoft access token expired');
    }

    if (!response.ok) {
      throw new BadRequestException(`Unable to fetch Outlook ${folder.toLowerCase()} messages`);
    }

    const payload = (await response.json()) as {
      value?: Array<{
        id: string;
        subject?: string;
        from?: { emailAddress?: { address?: string } };
        toRecipients?: Array<{ emailAddress?: { address?: string } }>;
        bodyPreview?: string;
        body?: { content?: string };
        receivedDateTime?: string;
        sentDateTime?: string;
        isRead?: boolean;
        hasAttachments?: boolean;
      }>;
    };

    return (payload.value || []).map((item) => {
      const to = (item.toRecipients || [])
        .map((recipient) => recipient.emailAddress?.address || '')
        .filter(Boolean);

      const body = stripHtml(item.body?.content) || item.bodyPreview || '';

      return {
        id: item.id,
        provider: 'outlook',
        from: item.from?.emailAddress?.address || 'Unknown sender',
        to,
        subject: item.subject || '(no subject)',
        body,
        preview: item.bodyPreview || createPreview(body),
        receivedAt: item.receivedDateTime || item.sentDateTime || new Date().toISOString(),
        isRead: folder === 'SENT' ? true : !!item.isRead,
        folder,
        hasAttachments: !!item.hasAttachments,
        attachments: [],
      };
    });
  }

  private getScopes(): string[] {
    return ['openid', 'profile', 'email', 'offline_access', 'User.Read', 'Mail.Read', 'Mail.Send'];
  }

  private getClientId(): string {
    return this.configService.get<string>('MAIL_MICROSOFT_CLIENT_ID') || '';
  }

  private getClientSecret(): string {
    return this.configService.get<string>('MAIL_MICROSOFT_CLIENT_SECRET') || '';
  }
}
