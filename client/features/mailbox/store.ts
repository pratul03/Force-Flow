'use client';

import { create } from 'zustand';
import { mailboxApi } from './api';
import {
  MailDraftAttachment,
  MailComposePayload,
  MailMessage,
  MailProvider,
  MailProviderConnection,
} from './types';
import { User } from '@/lib/types';

type MessagesByProvider = Record<MailProvider, MailMessage[]>;
type ProviderMap = Record<MailProvider, MailProviderConnection>;

interface MailViewState {
  activeProvider: MailProvider | null;
  providers: ProviderMap;
  messagesByProvider: MessagesByProvider;
}

interface MailStoreState extends MailViewState {
  currentUserId: string | null;
  currentUserEmail: string | null;
  currentUserName: string | null;
  isConnectDialogOpen: boolean;
  hasPromptBeenShownInSession: boolean;
  isConnecting: boolean;
  isSyncing: boolean;
  connectionError: string | null;
  syncError: string | null;
  initializeForUser: (user: User) => void;
  maybeOpenConnectDialog: () => void;
  closeConnectDialog: () => void;
  clearConnectionError: () => void;
  connectProvider: (provider: MailProvider) => Promise<boolean>;
  completeOAuthCallbackIfPresent: () => Promise<boolean>;
  disconnectProvider: (provider: MailProvider) => void;
  setActiveProvider: (provider: MailProvider) => void;
  syncProviderMessages: (provider: MailProvider) => Promise<void>;
  markAsRead: (provider: MailProvider, messageId: string) => Promise<void>;
  sendEmail: (
    payload: MailComposePayload,
  ) => Promise<{ success: boolean; error?: string }>;
}

function createConnection(
  provider: MailProvider,
  partial?: Partial<MailProviderConnection>,
): MailProviderConnection {
  return {
    provider,
    connected: partial?.connected || false,
    connectedAt: partial?.connectedAt || null,
    accountEmail: partial?.accountEmail || null,
    accessToken: null,
    refreshToken: null,
    tokenType: null,
    expiresAt: partial?.expiresAt || null,
    clientIdConfigured: partial?.clientIdConfigured ?? false,
  };
}

function createEmptyProviders(): ProviderMap {
  return {
    gmail: createConnection('gmail'),
    outlook: createConnection('outlook'),
  };
}

function createEmptyMessages(): MessagesByProvider {
  return {
    gmail: [],
    outlook: [],
  };
}

function getConnectedProviders(providers: ProviderMap): MailProvider[] {
  return (Object.keys(providers) as MailProvider[]).filter(
    (provider) => providers[provider].connected,
  );
}

function makeMessageId(provider: MailProvider): string {
  return `${provider}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function createPreview(body: string): string {
  return body.replace(/\s+/g, ' ').trim().slice(0, 160);
}

function parseCommaSeparatedEmails(input: string): string[] {
  return input
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function clearOAuthQueryParams(): void {
  if (typeof window === 'undefined') {
    return;
  }

  const url = new URL(window.location.href);
  url.searchParams.delete('code');
  url.searchParams.delete('state');
  url.searchParams.delete('error');
  url.searchParams.delete('error_description');
  url.searchParams.delete('session_state');

  const nextUrl = `${url.pathname}${url.search}${url.hash}`;
  window.history.replaceState({}, '', nextUrl);
}

function parseOAuthProvider(stateParam: string | null): MailProvider | null {
  if (!stateParam) {
    return null;
  }

  const [provider] = stateParam.split(':');
  if (provider === 'gmail' || provider === 'outlook') {
    return provider;
  }

  return null;
}

function toMailboxErrorMessage(error?: string, fallback?: string): string {
  if (!error) {
    return fallback || 'Unable to continue mailbox connection.';
  }

  const normalized = error.toLowerCase();
  if (
    normalized.includes('missing bearer token') ||
    normalized.includes('invalid or expired access token') ||
    normalized.includes('unauthorized')
  ) {
    return 'Your session has expired. Please sign in again and retry mailbox connection.';
  }

  return error;
}

function resolveActiveProvider(
  providers: ProviderMap,
  preferred?: MailProvider | null,
): MailProvider | null {
  const connectedProviders = getConnectedProviders(providers);

  if (preferred && connectedProviders.includes(preferred)) {
    return preferred;
  }

  return connectedProviders[0] ?? null;
}

function mergeProviders(
  incoming?: Partial<Record<MailProvider, MailProviderConnection>>,
): ProviderMap {
  return {
    gmail: createConnection('gmail', incoming?.gmail),
    outlook: createConnection('outlook', incoming?.outlook),
  };
}

export const useMailStore = create<MailStoreState>((set, get) => ({
  currentUserId: null,
  currentUserEmail: null,
  currentUserName: null,
  activeProvider: null,
  providers: createEmptyProviders(),
  messagesByProvider: createEmptyMessages(),
  isConnectDialogOpen: false,
  hasPromptBeenShownInSession: false,
  isConnecting: false,
  isSyncing: false,
  connectionError: null,
  syncError: null,

  initializeForUser: (user) => {
    const existingState = get();
    if (existingState.currentUserId === user.id) {
      set({
        currentUserEmail: user.email,
        currentUserName: user.name,
      });
      void mailboxApi.getProviderStatus().then((response) => {
        if (!response.success || !response.data) {
          return;
        }

        set((state) => {
          const providers = mergeProviders(response.data?.providers);
          return {
            ...state,
            providers,
            activeProvider: resolveActiveProvider(providers, state.activeProvider),
          };
        });
      });
      return;
    }

    set({
      currentUserId: user.id,
      currentUserEmail: user.email,
      currentUserName: user.name,
      activeProvider: null,
      providers: createEmptyProviders(),
      messagesByProvider: createEmptyMessages(),
      isConnectDialogOpen: false,
      hasPromptBeenShownInSession: false,
      isConnecting: false,
      isSyncing: false,
      connectionError: null,
      syncError: null,
    });

    void mailboxApi.getProviderStatus().then((response) => {
      if (!response.success || !response.data) {
        return;
      }

      set((state) => {
        const providers = mergeProviders(response.data?.providers);
        return {
          ...state,
          providers,
          activeProvider: resolveActiveProvider(providers, state.activeProvider),
        };
      });
    });
  },

  maybeOpenConnectDialog: () => {
    const state = get();
    if (state.hasPromptBeenShownInSession || !state.currentUserId) {
      return;
    }

    const connectedProviders = getConnectedProviders(state.providers);
    set({
      isConnectDialogOpen: connectedProviders.length === 0,
      hasPromptBeenShownInSession: true,
    });
  },

  closeConnectDialog: () => {
    set({ isConnectDialogOpen: false });
  },

  clearConnectionError: () => {
    set({ connectionError: null });
  },

  connectProvider: async (provider) => {
    if (typeof window === 'undefined') {
      return false;
    }

    const current = get();
    if (!current.currentUserId) {
      set({
        connectionError:
          'Please login before connecting mailbox providers.',
      });
      return false;
    }

    try {
      set({ isConnecting: true, connectionError: null });

      const response = await mailboxApi.startConnect(provider);
      if (!response.success || !response.data) {
        set({
          isConnecting: false,
          connectionError: toMailboxErrorMessage(
            response.error,
            'Unable to start provider OAuth flow',
          ),
        });
        return false;
      }

      window.location.href = response.data.authUrl;

      return true;
    } catch (error) {
      set({
        isConnecting: false,
        connectionError: toMailboxErrorMessage(
          error instanceof Error ? error.message : undefined,
          'Unable to start provider OAuth flow',
        ),
      });
      return false;
    }
  },

  completeOAuthCallbackIfPresent: async () => {
    if (typeof window === 'undefined') {
      return false;
    }

    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const stateParam = params.get('state');
    const oauthError = params.get('error');
    const oauthErrorDescription = params.get('error_description');

    if (!code && !oauthError) {
      return false;
    }

    const provider = parseOAuthProvider(stateParam);
    if (!provider) {
      set({ connectionError: 'Invalid OAuth state received from provider.' });
      clearOAuthQueryParams();
      return false;
    }

    if (oauthError) {
      set({
        connectionError: oauthErrorDescription
          ? decodeURIComponent(oauthErrorDescription)
          : `OAuth failed: ${oauthError}`,
      });
      clearOAuthQueryParams();
      return true;
    }

    try {
      set({ isConnecting: true, connectionError: null });

      if (!code || !stateParam) {
        set({
          isConnecting: false,
          connectionError: 'Missing OAuth callback parameters.',
        });
        clearOAuthQueryParams();
        return true;
      }

      const response = await mailboxApi.completeOAuth(code, stateParam);
      if (!response.success || !response.data) {
        set({
          isConnecting: false,
          connectionError: response.error || 'Provider OAuth callback failed.',
        });
        clearOAuthQueryParams();
        return true;
      }

      const status = await mailboxApi.getProviderStatus();
      const providers = mergeProviders(status.data?.providers);

      set((state) => ({
        ...state,
        providers,
        activeProvider: state.activeProvider || provider,
        isConnectDialogOpen: false,
        isConnecting: false,
        connectionError: null,
      }));

      await get().syncProviderMessages(provider);
      clearOAuthQueryParams();
      return true;
    } catch (error) {
      set({
        isConnecting: false,
        connectionError:
          error instanceof Error
            ? error.message
            : 'Provider OAuth callback failed.',
      });
      clearOAuthQueryParams();
      return true;
    }
  },

  disconnectProvider: (provider) => {
    set((state) => {
      const nextProviders: ProviderMap = {
        ...state.providers,
        [provider]: {
          ...state.providers[provider],
          connected: false,
          connectedAt: null,
          accountEmail: null,
          accessToken: null,
          refreshToken: null,
          tokenType: null,
          expiresAt: null,
        },
      };

      const nextActiveProvider =
        state.activeProvider === provider
          ? resolveActiveProvider(nextProviders, null)
          : state.activeProvider;

      const nextState: MailStoreState = {
        ...state,
        providers: nextProviders,
        activeProvider: nextActiveProvider,
        messagesByProvider: {
          ...state.messagesByProvider,
          [provider]: [],
        },
      };

      return nextState;
    });

    void mailboxApi.disconnectProvider(provider).then((response) => {
      if (!response.success) {
        set({
          connectionError: response.error || `Failed to disconnect ${provider}`,
        });
      }
    });
  },

  setActiveProvider: (provider) => {
    set((state) => {
      if (!state.providers[provider].connected) {
        return state;
      }

      const nextState: MailStoreState = {
        ...state,
        activeProvider: provider,
      };

      return nextState;
    });
  },

  syncProviderMessages: async (provider) => {
    const state = get();
    const providerConnection = state.providers[provider];

    if (!providerConnection.connected) {
      return;
    }

    try {
      set({ isSyncing: true, syncError: null });

      const response = await mailboxApi.syncProvider(provider);
      if (!response.success || !response.data) {
        throw new Error(response.error || `Failed to sync ${provider}`);
      }

      const messages = response.data.messages;

      set((current) => {
        return {
          ...current,
          messagesByProvider: {
            ...current.messagesByProvider,
            [provider]: messages,
          },
          isSyncing: false,
          syncError: null,
        };
      });
    } catch (error) {
      set({
        isSyncing: false,
        syncError:
          error instanceof Error
            ? error.message
            : `Failed to sync ${provider} mailbox`,
      });
    }
  },

  markAsRead: async (provider, messageId) => {
    set((state) => {
      const nextMessages = state.messagesByProvider[provider].map((message) =>
        message.id === messageId ? { ...message, isRead: true } : message,
      );

      const nextState: MailStoreState = {
        ...state,
        messagesByProvider: {
          ...state.messagesByProvider,
          [provider]: nextMessages,
        },
      };

      return nextState;
    });

    void mailboxApi.markAsRead(provider, messageId);
  },

  sendEmail: async (payload) => {
    const state = get();
    const providerConnection = state.providers[payload.provider];
    if (
      !providerConnection.connected ||
      !providerConnection.accountEmail
    ) {
      return {
        success: false,
        error: 'Mailbox provider is not connected.',
      };
    }

    try {
      const toRecipients = parseCommaSeparatedEmails(payload.to);
      if (toRecipients.length === 0) {
        return {
          success: false,
          error: 'Please provide at least one valid recipient.',
        };
      }

      let providerMessageId = makeMessageId(payload.provider);

      const response = await mailboxApi.sendEmail(payload.provider, payload);
      if (!response.success) {
        return {
          success: false,
          error: response.error || 'Send email failed',
        };
      }

      providerMessageId = response.data?.providerMessageId || providerMessageId;

      set((current) => {
        const attachments = payload.attachments.map((attachment: MailDraftAttachment) => ({
          id: attachment.id,
          name: attachment.name,
          size: attachment.size,
          type: attachment.type,
        }));

        const sentMessage: MailMessage = {
          id: providerMessageId,
          provider: payload.provider,
          from: providerConnection.accountEmail || 'me',
          to: toRecipients,
          subject: payload.subject,
          body: payload.body,
          preview: createPreview(payload.body),
          receivedAt: new Date().toISOString(),
          isRead: true,
          folder: 'SENT',
          hasAttachments: attachments.length > 0,
          attachments,
        };

        const nextState: MailStoreState = {
          ...current,
          messagesByProvider: {
            ...current.messagesByProvider,
            [payload.provider]: [
              sentMessage,
              ...current.messagesByProvider[payload.provider],
            ],
          },
        };

        return nextState;
      });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Send email failed',
      };
    }
  },
}));
