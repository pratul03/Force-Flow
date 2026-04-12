import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { MailConnection, MailProvider } from '@prisma/client';
import { createHash, randomBytes } from 'crypto';
import { PrismaService } from '../../../prisma/prisma.service';
import { CompleteMailOAuthDto } from '../dto/complete-mail-oauth.dto';
import { SendMailDto } from '../dto/send-mail.dto';
import {
  MailProviderClient,
  MailProviderConnectionStatus,
  SendMailPayload,
} from './provider-clients/mail-provider.types';
import { GmailProviderClient } from './provider-clients/gmail-provider.client';
import { OutlookProviderClient } from './provider-clients/outlook-provider.client';
import { createNonce, parseCommaSeparatedEmails } from './provider-clients/provider-client.utils';
import { TokenCipherService } from './token-cipher.service';

@Injectable()
export class MailboxService {
  private readonly oauthSessionTtlMs = 10 * 60 * 1000;

  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenCipherService: TokenCipherService,
    private readonly gmailProviderClient: GmailProviderClient,
    private readonly outlookProviderClient: OutlookProviderClient,
  ) {}

  async getProviderStatuses(userId: string) {
    const [gmailConnection, outlookConnection] = await Promise.all([
      this.prisma.mailConnection.findUnique({
        where: {
          userId_provider: {
            userId,
            provider: MailProvider.GMAIL,
          },
        },
      }),
      this.prisma.mailConnection.findUnique({
        where: {
          userId_provider: {
            userId,
            provider: MailProvider.OUTLOOK,
          },
        },
      }),
    ]);

    return {
      providers: {
        gmail: this.toConnectionStatus('gmail', gmailConnection, this.gmailProviderClient),
        outlook: this.toConnectionStatus('outlook', outlookConnection, this.outlookProviderClient),
      },
    };
  }

  async startOAuth(
    userId: string,
    providerKey: 'gmail' | 'outlook',
  ) {
    const providerClient = this.getProviderClient(providerKey);

    if (!providerClient.isConfigured()) {
      throw new BadRequestException(
        `${providerKey} provider is not configured on the server environment`,
      );
    }

    const codeVerifier = randomBytes(64).toString('base64url');
    const codeChallenge = createHash('sha256').update(codeVerifier).digest('base64url');
    const state = `${providerKey}:${createNonce(18)}`;
    const redirectUri = this.getProviderRedirectUri(providerKey);

    const expiresAt = new Date(Date.now() + this.oauthSessionTtlMs);

    await this.prisma.mailOAuthSession.create({
      data: {
        userId,
        provider: providerClient.provider,
        state,
        codeVerifier,
        redirectUri,
        expiresAt,
      },
    });

    return providerClient.startOAuth({
      state,
      codeChallenge,
      redirectUri,
    });
  }

  async completeOAuth(userId: string, dto: CompleteMailOAuthDto) {
    const session = await this.prisma.mailOAuthSession.findUnique({
      where: { state: dto.state },
    });

    if (!session || session.userId !== userId) {
      throw new BadRequestException('Invalid OAuth state');
    }

    if (session.expiresAt.getTime() <= Date.now()) {
      await this.prisma.mailOAuthSession.delete({ where: { id: session.id } });
      throw new BadRequestException('OAuth session expired. Please retry connection.');
    }

    const providerKey = this.toProviderKey(session.provider);
    const providerClient = this.getProviderClient(providerKey);

    const tokenPayload = await providerClient.exchangeAuthorizationCode({
      code: dto.code,
      codeVerifier: session.codeVerifier,
      redirectUri: session.redirectUri,
    });

    const accountEmail = await providerClient.fetchAccountEmail(tokenPayload.accessToken);

    const expiresAt = tokenPayload.expiresIn
      ? new Date(Date.now() + tokenPayload.expiresIn * 1000)
      : null;

    await this.prisma.mailConnection.upsert({
      where: {
        userId_provider: {
          userId,
          provider: session.provider,
        },
      },
      create: {
        userId,
        provider: session.provider,
        accountEmail,
        accessTokenEnc: this.tokenCipherService.encrypt(tokenPayload.accessToken),
        refreshTokenEnc: tokenPayload.refreshToken
          ? this.tokenCipherService.encrypt(tokenPayload.refreshToken)
          : null,
        tokenType: tokenPayload.tokenType || 'Bearer',
        expiresAt,
        scopes: this.getProviderScopes(session.provider),
      },
      update: {
        accountEmail,
        accessTokenEnc: this.tokenCipherService.encrypt(tokenPayload.accessToken),
        refreshTokenEnc: tokenPayload.refreshToken
          ? this.tokenCipherService.encrypt(tokenPayload.refreshToken)
          : undefined,
        tokenType: tokenPayload.tokenType || 'Bearer',
        expiresAt,
        connectedAt: new Date(),
        scopes: this.getProviderScopes(session.provider),
      },
    });

    await this.prisma.mailOAuthSession.delete({ where: { id: session.id } });

    const connection = await this.prisma.mailConnection.findUnique({
      where: {
        userId_provider: {
          userId,
          provider: session.provider,
        },
      },
    });

    return {
      provider: providerKey,
      connection: this.toConnectionStatus(providerKey, connection, providerClient),
    };
  }

  async disconnectProvider(userId: string, providerKey: 'gmail' | 'outlook') {
    const provider = this.toProviderEnum(providerKey);

    await this.prisma.mailConnection.deleteMany({
      where: {
        userId,
        provider,
      },
    });

    await this.prisma.mailOAuthSession.deleteMany({
      where: {
        userId,
        provider,
      },
    });

    return {
      disconnected: true,
      provider: providerKey,
    };
  }

  async syncMessages(userId: string, providerKey: 'gmail' | 'outlook') {
    const providerClient = this.getProviderClient(providerKey);

    return this.withProviderConnection(userId, providerKey, async (connection, accessToken) => {
      const messages = await providerClient.fetchMessages(accessToken);
      await this.prisma.mailConnection.update({
        where: { id: connection.id },
        data: { updatedAt: new Date() },
      });

      return {
        provider: providerKey,
        messages,
      };
    });
  }

  async markAsRead(userId: string, providerKey: 'gmail' | 'outlook', messageId: string) {
    const providerClient = this.getProviderClient(providerKey);

    return this.withProviderConnection(userId, providerKey, async (_connection, accessToken) => {
      await providerClient.markMessageAsRead(accessToken, messageId);
      return {
        provider: providerKey,
        messageId,
        updated: true,
      };
    });
  }

  async sendEmail(userId: string, providerKey: 'gmail' | 'outlook', dto: SendMailDto) {
    const providerClient = this.getProviderClient(providerKey);

    const recipients = parseCommaSeparatedEmails(dto.to);
    if (recipients.length === 0) {
      throw new BadRequestException('Please provide at least one valid recipient');
    }

    const payload: SendMailPayload = {
      to: dto.to,
      subject: dto.subject,
      body: dto.body,
      attachments: dto.attachments,
    };

    return this.withProviderConnection(userId, providerKey, async (connection, accessToken) => {
      const response = await providerClient.sendMessage({
        accessToken,
        fromEmail: connection.accountEmail,
        payload,
      });

      return {
        provider: providerKey,
        sent: true,
        providerMessageId: response.id || null,
      };
    });
  }

  private async withProviderConnection<T>(
    userId: string,
    providerKey: 'gmail' | 'outlook',
    handler: (connection: MailConnection, accessToken: string) => Promise<T>,
  ): Promise<T> {
    const provider = this.toProviderEnum(providerKey);
    const providerClient = this.getProviderClient(providerKey);

    const connection = await this.prisma.mailConnection.findUnique({
      where: {
        userId_provider: {
          userId,
          provider,
        },
      },
    });

    if (!connection) {
      throw new NotFoundException(`${providerKey} is not connected`);
    }

    const accessToken = this.tokenCipherService.decrypt(connection.accessTokenEnc);

    try {
      const tokenForCall = await this.ensureFreshAccessToken(connection, providerClient, accessToken);
      return await handler(connection, tokenForCall);
    } catch (error) {
      if (error instanceof UnauthorizedException && connection.refreshTokenEnc) {
        const refreshedAccessToken = await this.refreshAccessToken(connection, providerClient);
        return handler(connection, refreshedAccessToken);
      }

      throw error;
    }
  }

  private async ensureFreshAccessToken(
    connection: MailConnection,
    providerClient: MailProviderClient,
    accessToken: string,
  ): Promise<string> {
    if (!connection.expiresAt) {
      return accessToken;
    }

    const expiresSoon = connection.expiresAt.getTime() - Date.now() <= 60 * 1000;
    if (!expiresSoon || !connection.refreshTokenEnc) {
      return accessToken;
    }

    return this.refreshAccessToken(connection, providerClient);
  }

  private async refreshAccessToken(
    connection: MailConnection,
    providerClient: MailProviderClient,
  ): Promise<string> {
    if (!connection.refreshTokenEnc) {
      throw new UnauthorizedException('Mailbox refresh token missing. Reconnect provider.');
    }

    const refreshToken = this.tokenCipherService.decrypt(connection.refreshTokenEnc);
    const refreshed = await providerClient.refreshAccessToken({ refreshToken });

    const updated = await this.prisma.mailConnection.update({
      where: { id: connection.id },
      data: {
        accessTokenEnc: this.tokenCipherService.encrypt(refreshed.accessToken),
        refreshTokenEnc: refreshed.refreshToken
          ? this.tokenCipherService.encrypt(refreshed.refreshToken)
          : connection.refreshTokenEnc,
        tokenType: refreshed.tokenType || connection.tokenType,
        expiresAt: refreshed.expiresIn
          ? new Date(Date.now() + refreshed.expiresIn * 1000)
          : connection.expiresAt,
      },
    });

    return this.tokenCipherService.decrypt(updated.accessTokenEnc);
  }

  private toConnectionStatus(
    provider: 'gmail' | 'outlook',
    connection: MailConnection | null,
    providerClient: MailProviderClient,
  ): MailProviderConnectionStatus {
    return {
      provider,
      connected: !!connection,
      connectedAt: connection?.connectedAt.toISOString() || null,
      accountEmail: connection?.accountEmail || null,
      accessToken: null,
      refreshToken: null,
      tokenType: null,
      expiresAt: connection?.expiresAt?.toISOString() || null,
      clientIdConfigured: providerClient.isConfigured(),
    };
  }

  private getProviderClient(providerKey: 'gmail' | 'outlook'): MailProviderClient {
    return providerKey === 'gmail' ? this.gmailProviderClient : this.outlookProviderClient;
  }

  private toProviderEnum(providerKey: 'gmail' | 'outlook'): MailProvider {
    return providerKey === 'gmail' ? MailProvider.GMAIL : MailProvider.OUTLOOK;
  }

  private toProviderKey(provider: MailProvider): 'gmail' | 'outlook' {
    return provider === MailProvider.GMAIL ? 'gmail' : 'outlook';
  }

  private getProviderRedirectUri(providerKey: 'gmail' | 'outlook'): string {
    const specific =
      providerKey === 'gmail'
        ? process.env.MAIL_GOOGLE_REDIRECT_URI
        : process.env.MAIL_MICROSOFT_REDIRECT_URI;

    if (specific) {
      return this.validateProviderRedirectUri(specific, providerKey);
    }

    const baseUrl = process.env.PUBLIC_APP_URL || 'http://localhost:3000';
    return this.validateProviderRedirectUri(`${baseUrl.replace(/\/$/, '')}/mailbox`, providerKey);
  }

  private validateProviderRedirectUri(
    redirectUri: string,
    providerKey: 'gmail' | 'outlook',
  ): string {
    let parsed: URL;
    try {
      parsed = new URL(redirectUri);
    } catch {
      throw new BadRequestException(
        `${providerKey} redirect URI is not a valid absolute URL in server env`,
      );
    }

    const isLocalhost = ['localhost', '127.0.0.1', '::1'].includes(parsed.hostname);
    if (process.env.NODE_ENV === 'production') {
      if (parsed.protocol !== 'https:') {
        throw new BadRequestException(
          `${providerKey} redirect URI must use https in production`,
        );
      }

      if (isLocalhost) {
        throw new BadRequestException(
          `${providerKey} redirect URI cannot target localhost in production`,
        );
      }
    }

    return parsed.toString();
  }

  private getProviderScopes(provider: MailProvider): string {
    if (provider === MailProvider.GMAIL) {
      return [
        'openid',
        'profile',
        'email',
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.send',
      ].join(' ');
    }

    return ['openid', 'profile', 'email', 'offline_access', 'User.Read', 'Mail.Read', 'Mail.Send'].join(
      ' ',
    );
  }
}
