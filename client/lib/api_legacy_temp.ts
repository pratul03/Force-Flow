import {
  ApiResponse,
  BackendLead,
  BackendLeave,
  BackendQuotation,
  BackendOrganizationSubscription,
  BackendSubscriptionCheckoutSessionResponse,
  BackendSubscriptionPlan,
  BackendTicketComment,
  BackendTicketStatusEvent,
  BackendTicket,
  BillingProvider,
  BackendOrganization,
  BackendTimeLog,
  BackendUser,
  ConfirmedUploadResponse,
  DashboardStats,
  Employee,
  MailComposePayload,
  MailMessage,
  MailProvider,
  MailProviderConnection,
  LeadStatus,
  LeaveRequest,
  LoginResponse,
  QuotationDesigner,
  QuotationLineItem,
  QuotationStatus,
  TicketPriority,
  TicketStatus,
  SignedUploadPayload,
  TimesheetEntry,
  User,
} from './types';
import { removeCookie } from './cookies';
import { processImageBeforeUpload } from './image-processing';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

type QueryValue = string | number | boolean | null | undefined;

type CloudinaryDirectUploadResponse = {
  secure_url: string;
  public_id: string;
};

function buildQuery(params: Record<string, QueryValue>) {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    query.append(key, String(value));
  }

  const asString = query.toString();
  return asString ? `?${asString}` : '';
}

class ApiClient {
  private readonly baseUrl: string;
  private refreshPromise: Promise<boolean> | null = null;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async refreshAccessToken(): Promise<boolean> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        const response = await fetch(`${this.baseUrl}/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        if (!response.ok) {
          return false;
        }

        return true;
      } catch {
        return false;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  private clearAuthCookies(): void {
    removeCookie('auth_token');
    removeCookie('auth_refresh_token');
    removeCookie('auth_user');
    removeCookie('auth_expiry');
  }

  private getHeaders(body?: unknown): Headers {
    const headers = new Headers();

    if (!(body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    return headers;
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {},
    allowRefresh = true,
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const config: RequestInit = {
      ...options,
      headers: this.getHeaders(options.body),
      credentials: 'include',
    };

    try {
      const response = await fetch(url, config);
      const isJson =
        response.headers.get('content-type')?.includes('application/json') ?? false;

      const payload = isJson ? await response.json().catch(() => null) : null;

      const isAuthEndpoint = endpoint.startsWith('/auth/');
      if (response.status === 401 && allowRefresh && !isAuthEndpoint) {
        const refreshed = await this.refreshAccessToken();

        if (refreshed) {
          return this.request<T>(endpoint, options, false);
        }

        this.clearAuthCookies();
      }

      if (!response.ok) {
        const errorMessage =
          (payload &&
            typeof payload === 'object' &&
            ('message' in payload || 'error' in payload) &&
            String((payload as { message?: unknown; error?: unknown }).message ??
              (payload as { error?: unknown }).error)) ||
          response.statusText ||
          'An error occurred';

        return {
          success: false,
          error: errorMessage,
        };
      }

      return {
        success: true,
        data: (payload ?? undefined) as T,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  get<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  post<T>(endpoint: string, body?: unknown) {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  }

  patch<T>(endpoint: string, body?: unknown) {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  }

  put<T>(endpoint: string, body?: unknown) {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  }

  delete<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();

export const authApi = {
  login: (email: string, password: string) =>
    apiClient.post<LoginResponse>('/auth/login', { email, password }),

  refreshToken: (refreshToken?: string) =>
    apiClient.post<LoginResponse>('/auth/refresh',
      refreshToken ? { refreshToken } : undefined),

  logout: (refreshToken?: string) =>
    apiClient.post<{ loggedOut: boolean }>('/auth/logout',
      refreshToken ? { refreshToken } : undefined),

  register: async (data: {
    name: string;
    email: string;
    password: string;
    organizationName?: string;
    country?: string;
  }) => {
    const now = Date.now();
    const organizationName =
      data.organizationName || `${data.name.split(' ')[0] || 'Team'} Organization`;

    const orgResp = await organizationsApi.create({
      name: organizationName,
      country: data.country || 'India',
      currency: 'INR',
      timezone: 'Asia/Kolkata',
    });

    if (!orgResp.success || !orgResp.data) {
      return {
        success: false,
        error: orgResp.error || 'Failed to create organization',
      } as ApiResponse<LoginResponse>;
    }

    const firstName = data.name.trim().split(' ')[0] || 'User';
    const lastName = data.name.trim().split(' ').slice(1).join(' ') || 'Account';

    const userResp = await usersApi.create({
      email: data.email,
      password: data.password,
      firstName,
      lastName,
      employeeId: `EMP${String(now).slice(-6)}`,
      organizationId: orgResp.data.id,
      joiningDate: new Date().toISOString(),
      role: 'ADMIN',
      status: 'ACTIVE',
    });

    if (!userResp.success) {
      return {
        success: false,
        error: userResp.error || 'Failed to create user',
      } as ApiResponse<LoginResponse>;
    }

    return authApi.login(data.email, data.password);
  },
};

export const organizationsApi = {
  create: (data: unknown) => apiClient.post<{ id: string }>('/organizations', data),
  getAll: () => apiClient.get<Array<BackendOrganization>>('/organizations'),
  getById: (id: string) => apiClient.get<BackendOrganization>(`/organizations/${id}`),
  update: (id: string, data: unknown) =>
    apiClient.patch<BackendOrganization>(`/organizations/${id}`, data),
  delete: (id: string) => apiClient.delete(`/organizations/${id}`),
};

export const usersApi = {
  create: (data: unknown) => apiClient.post<BackendUser>('/users', data),
  getAll: () => apiClient.get<BackendUser[]>('/users'),
  getById: (id: string) => apiClient.get<BackendUser>(`/users/${id}`),
  update: (id: string, data: unknown) => apiClient.patch<BackendUser>(`/users/${id}`, data),
  delete: (id: string) => apiClient.delete<{ deleted: boolean; id: string }>(`/users/${id}`),
};

export const departmentsApi = {
  create: (data: unknown) => apiClient.post('/departments', data),
  getAll: (organizationId?: string) =>
    apiClient.get(`/departments${buildQuery({ organizationId })}`),
  getById: (id: string) => apiClient.get(`/departments/${id}`),
  update: (id: string, data: unknown) => apiClient.patch(`/departments/${id}`, data),
  delete: (id: string) => apiClient.delete(`/departments/${id}`),
};

export const designationsApi = {
  create: (data: unknown) => apiClient.post('/designations', data),
  getAll: (organizationId?: string) =>
    apiClient.get(`/designations${buildQuery({ organizationId })}`),
  getById: (id: string) => apiClient.get(`/designations/${id}`),
  update: (id: string, data: unknown) => apiClient.patch(`/designations/${id}`, data),
  delete: (id: string) => apiClient.delete(`/designations/${id}`),
};

export const locationsApi = {
  create: (data: unknown) => apiClient.post('/locations', data),
  getAll: (organizationId?: string) =>
    apiClient.get(`/locations${buildQuery({ organizationId })}`),
  getById: (id: string) => apiClient.get(`/locations/${id}`),
  update: (id: string, data: unknown) => apiClient.patch(`/locations/${id}`, data),
  delete: (id: string) => apiClient.delete(`/locations/${id}`),
};

export const shiftsApi = {
  create: (data: unknown) => apiClient.post('/shifts', data),
  getAll: (organizationId?: string) =>
    apiClient.get(`/shifts${buildQuery({ organizationId })}`),
  getById: (id: string) => apiClient.get(`/shifts/${id}`),
  update: (id: string, data: unknown) => apiClient.patch(`/shifts/${id}`, data),
  delete: (id: string) => apiClient.delete(`/shifts/${id}`),
  assign: (data: unknown) => apiClient.post('/shifts/assignments', data),
  assignmentList: (userId?: string) =>
    apiClient.get(`/shifts/assignments/list${buildQuery({ userId })}`),
};

export const timelogsApi = {
  create: (data: unknown) => apiClient.post<BackendTimeLog>('/timelogs', data),
  getAll: (userId?: string) => apiClient.get<BackendTimeLog[]>(`/timelogs${buildQuery({ userId })}`),
  getById: (id: string) => apiClient.get<BackendTimeLog>(`/timelogs/${id}`),
  update: (id: string, data: unknown) => apiClient.patch<BackendTimeLog>(`/timelogs/${id}`, data),
  delete: (id: string) => apiClient.delete(`/timelogs/${id}`),
};

export const attendanceApi = {
  clockIn: (data: unknown) => apiClient.post('/attendance/clock-in', data),
  clockOut: (data: unknown) => apiClient.post('/attendance/clock-out', data),
  getUserAttendance: (userId: string, from?: string, to?: string) =>
    apiClient.get(`/attendance/user/${userId}${buildQuery({ from, to })}`),
  getDailySummary: (userId: string, date?: string) =>
    apiClient.get(`/attendance/user/${userId}/daily-summary${buildQuery({ date })}`),
};

export const leavesApi = {
  create: (data: unknown) => apiClient.post<BackendLeave>('/leaves', data),
  apply: (data: unknown) => apiClient.post<BackendLeave>('/leaves/apply', data),
  getAll: (params?: { userId?: string; approverId?: string; status?: string }) =>
    apiClient.get<BackendLeave[]>(
      `/leaves${buildQuery({
        userId: params?.userId,
        approverId: params?.approverId,
        status: params?.status,
      })}`,
    ),
  pending: (approverId?: string) => apiClient.get(`/leaves/pending${buildQuery({ approverId })}`),
  getById: (id: string) => apiClient.get<BackendLeave>(`/leaves/${id}`),
  update: (id: string, data: unknown) => apiClient.patch<BackendLeave>(`/leaves/${id}`, data),
  approve: (id: string, actorUserId: string) =>
    apiClient.post(`/leaves/${id}/approve`, { actorUserId }),
  reject: (id: string, actorUserId: string, reason: string) =>
    apiClient.post(`/leaves/${id}/reject`, { actorUserId, reason }),
  cancel: (id: string, actorUserId: string, reason?: string) =>
    apiClient.post(`/leaves/${id}/cancel`, { actorUserId, reason }),
  delete: (id: string) => apiClient.delete(`/leaves/${id}`),
};

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

export const holidaysApi = {
  status: () => apiClient.get('/holidays/status'),
  list: (params?: { organizationId?: string; from?: string; to?: string }) =>
    apiClient.get(`/holidays${buildQuery(params || {})}`),
  create: (data: unknown) => apiClient.post('/holidays', data),
  sync: (data: unknown) => apiClient.post('/holidays/sync', data),
  delete: (id: string) => apiClient.delete(`/holidays/${id}`),
};

export const payrollApi = {
  preview: (userId: string, month?: number, year?: number) =>
    apiClient.get(`/payroll/preview/${userId}${buildQuery({ month, year })}`),
  generate: (data: unknown) => apiClient.post('/payroll/generate', data),
  invoices: (params?: { userId?: string; month?: number; year?: number; status?: string }) =>
    apiClient.get(
      `/payroll/invoices${buildQuery({
        userId: params?.userId,
        month: params?.month,
        year: params?.year,
        status: params?.status,
      })}`,
    ),
  invoice: (id: string) => apiClient.get(`/payroll/invoices/${id}`),
  renderInvoice: (id: string) => apiClient.get(`/payroll/invoices/${id}/render`),
  invoicePdfUrl: (id: string) => `${API_BASE_URL}/payroll/invoices/${id}/pdf`,
  markPaid: (id: string, paymentReference: string) =>
    apiClient.patch(`/payroll/invoices/${id}/paid`, { paymentReference }),
};

export const compensationApi = {
  status: () => apiClient.get('/compensation/status'),
  preview: (userId: string, month?: number, year?: number) =>
    apiClient.get(`/compensation/preview/${userId}${buildQuery({ month, year })}`),
  settlements: (params?: { userId?: string; month?: number; year?: number }) =>
    apiClient.get(`/compensation/settlements${buildQuery(params || {})}`),
  recalculate: (data: unknown) => apiClient.post('/compensation/recalculate', data),
};

export const walletsApi = {
  getUserWallet: (userId: string) => apiClient.get(`/wallets/user/${userId}`),
  bootstrap: (userId: string, currency?: string) =>
    apiClient.post(`/wallets/user/${userId}/bootstrap${buildQuery({ currency })}`),
  transactions: (userId?: string) =>
    apiClient.get(`/wallets/transactions${buildQuery({ userId })}`),
  createTransaction: (data: unknown) => apiClient.post('/wallets/transactions', data),
  requestWithdrawal: (data: unknown) => apiClient.post('/wallets/withdrawals', data),
  retryWithdrawal: (transactionId: string) =>
    apiClient.post(`/wallets/withdrawals/${transactionId}/retry`),
};

export const currencyApi = {
  rates: (baseCurrency?: string) => apiClient.get(`/currency/rates${buildQuery({ baseCurrency })}`),
  history: (params?: { from?: string; to?: string; limit?: number }) =>
    apiClient.get(`/currency/history${buildQuery(params || {})}`),
  convert: (data: unknown) => apiClient.post('/currency/convert', data),
  sync: (source?: string) => apiClient.post('/currency/sync', { source }),
};

export const notificationsApi = {
  send: (data: unknown) => apiClient.post('/notifications/send', data),
  logs: (params?: { userId?: string; status?: string; limit?: number }) =>
    apiClient.get(`/notifications/logs${buildQuery(params || {})}`),
};

export const reportsApi = {
  overview: () => apiClient.get('/reports/overview'),
};

export const schedulerApi = {
  nightly: (organizationId?: string) => apiClient.post('/scheduler/nightly', { organizationId }),
  payroll: (data: unknown) => apiClient.post('/scheduler/payroll', data),
  jobs: (types?: string[]) => apiClient.post('/scheduler/jobs', { types }),
};

export const queueApi = {
  enqueue: (data: unknown) => apiClient.post('/queue/jobs', data),
  list: (limit?: number, status?: string) =>
    apiClient.get(`/queue/jobs${buildQuery({ limit, status })}`),
  process: () => apiClient.post('/queue/jobs/process'),
};

export const performanceApi = {
  status: (organizationId?: string) =>
    apiClient.get(`/performance/status${buildQuery({ organizationId })}`),
  reviews: (params?: { organizationId?: string; userId?: string; month?: number; year?: number }) =>
    apiClient.get(`/performance/reviews${buildQuery(params || {})}`),
  upsertReview: (data: unknown) => apiClient.post('/performance/reviews', data),
  reviewCycle: (data: unknown) => apiClient.post('/performance/review-cycle', data),
};

export const recruitmentApi = {
  status: (organizationId?: string) =>
    apiClient.get(`/recruitment/status${buildQuery({ organizationId })}`),
  candidates: (params?: { organizationId?: string; stage?: string; limit?: number }) =>
    apiClient.get(`/recruitment/candidates${buildQuery(params || {})}`),
  createCandidate: (data: unknown) => apiClient.post('/recruitment/candidates', data),
  updateCandidateStage: (id: string, data: unknown) =>
    apiClient.patch(`/recruitment/candidates/${id}/stage`, data),
  scoreApplications: (data: unknown) => apiClient.post('/recruitment/score-applications', data),
};

export const assetsApi = {
  status: (organizationId?: string) => apiClient.get(`/assets/status${buildQuery({ organizationId })}`),
  list: (params?: { organizationId?: string; status?: string; assignedToUserId?: string }) =>
    apiClient.get(`/assets${buildQuery(params || {})}`),
  create: (data: unknown) => apiClient.post('/assets', data),
  assign: (id: string, data: unknown) => apiClient.patch(`/assets/${id}/assign`, data),
  depreciation: (data: unknown) => apiClient.post('/assets/depreciation', data),
};

export const ticketsApi = {
  list: (params?: {
    organizationId?: string;
    requesterId?: string;
    assigneeId?: string;
    status?: TicketStatus;
    priority?: TicketPriority;
    limit?: number;
  }) => apiClient.get<BackendTicket[]>(`/tickets${buildQuery(params || {})}`),
  getById: (id: string) => apiClient.get<BackendTicket>(`/tickets/${id}`),
  create: (data: {
    organizationId: string;
    requesterId: string;
    title: string;
    description: string;
    priority?: TicketPriority;
    assigneeId?: string;
  }) => apiClient.post<BackendTicket>('/tickets', data),
  assign: (id: string, data: { actorUserId: string; assigneeId: string; status?: TicketStatus }) =>
    apiClient.patch<BackendTicket>(`/tickets/${id}/assign`, data),
  updateStatus: (
    id: string,
    data: {
      actorUserId: string;
      status: TicketStatus;
      resolutionNote?: string;
    },
  ) => apiClient.patch<BackendTicket>(`/tickets/${id}/status`, data),
  comments: (id: string, params: { actorUserId: string; limit?: number }) =>
    apiClient.get<BackendTicketComment[]>(`/tickets/${id}/comments${buildQuery(params)}`),
  addComment: (
    id: string,
    data: {
      actorUserId: string;
      body: string;
    },
  ) => apiClient.post<BackendTicketComment>(`/tickets/${id}/comments`, data),
  history: (id: string, params: { actorUserId: string; limit?: number }) =>
    apiClient.get<BackendTicketStatusEvent[]>(`/tickets/${id}/history${buildQuery(params)}`),
};

export const leadsApi = {
  list: (params?: {
    organizationId?: string;
    status?: LeadStatus;
    search?: string;
    limit?: number;
  }) => apiClient.get<BackendLead[]>(`/leads${buildQuery(params || {})}`),
  getById: (id: string) => apiClient.get<BackendLead>(`/leads/${id}`),
  create: (data: {
    organizationId: string;
    actorUserId: string;
    name: string;
    company: string;
    email: string;
    phone?: string;
    source?: string;
    notes?: string;
    status?: LeadStatus;
    expectedAmount?: number;
    currency?: string;
  }) => apiClient.post<BackendLead>('/leads', data),
  update: (
    id: string,
    data: {
      actorUserId: string;
      name?: string;
      company?: string;
      email?: string;
      phone?: string;
      source?: string;
      notes?: string;
      status?: LeadStatus;
      expectedAmount?: number;
      currency?: string;
    },
  ) => apiClient.patch<BackendLead>(`/leads/${id}`, data),
  delete: (id: string, actorUserId: string) =>
    apiClient.delete<{ deleted: boolean; id: string }>(
      `/leads/${id}${buildQuery({ actorUserId })}`,
    ),
};

async function downloadQuotationPdfBlob(
  endpoint: string,
): Promise<ApiResponse<{ blob: Blob; fileName?: string }>> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      return {
        success: false,
        error: response.statusText || 'Failed to download quotation PDF',
      };
    }

    const blob = await response.blob();
    const disposition = response.headers.get('content-disposition') || '';
    const fileName = disposition.includes('filename=')
      ? disposition.split('filename=')[1]?.replaceAll('"', '').trim()
      : undefined;

    return {
      success: true,
      data: { blob, fileName },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to download quotation PDF',
    };
  }
}

export const quotationsApi = {
  list: (params?: {
    organizationId?: string;
    leadId?: string;
    status?: QuotationStatus;
    limit?: number;
  }) => apiClient.get<BackendQuotation[]>(`/quotations${buildQuery(params || {})}`),
  getById: (id: string) => apiClient.get<BackendQuotation>(`/quotations/${id}`),
  create: (data: {
    organizationId: string;
    leadId: string;
    actorUserId: string;
    title: string;
    description: string;
    amount?: number;
    currency?: string;
    taxPercent?: number;
    discountPercent?: number;
    validUntil?: string;
    lineItems?: QuotationLineItem[];
    designer?: QuotationDesigner;
  }) => apiClient.post<BackendQuotation>('/quotations', data),
  update: (
    id: string,
    data: {
      actorUserId: string;
      title?: string;
      description?: string;
      amount?: number;
      currency?: string;
      taxPercent?: number;
      discountPercent?: number;
      validUntil?: string;
      lineItems?: QuotationLineItem[];
      designer?: QuotationDesigner;
    },
  ) => apiClient.patch<BackendQuotation>(`/quotations/${id}`, data),
  remove: (id: string, actorUserId: string) =>
    apiClient.delete<{ deleted: boolean; id: string }>(
      `/quotations/${id}${buildQuery({ actorUserId })}`,
    ),
  send: (id: string, data: { actorUserId: string; emailMessage?: string }) =>
    apiClient.post<{
      quotation: BackendQuotation;
      publicUrl: string;
    }>(`/quotations/${id}/send`, data),
  manualApprove: (id: string, data: { actorUserId: string; note?: string }) =>
    apiClient.post<BackendQuotation>(`/quotations/${id}/manual-approve`, data),
  manualReject: (id: string, data: { actorUserId: string; note?: string }) =>
    apiClient.post<BackendQuotation>(`/quotations/${id}/manual-reject`, data),
  downloadPdf: (id: string, actorUserId: string) =>
    downloadQuotationPdfBlob(`/quotations/${id}/pdf${buildQuery({ actorUserId })}`),
  publicDetails: (token: string) =>
    apiClient.get<BackendQuotation>(`/quotations/public/${token}`),
  publicApprove: (
    token: string,
    data: { clientName?: string; note?: string },
  ) => apiClient.post<BackendQuotation>(`/quotations/public/${token}/approve`, data),
  publicReject: (
    token: string,
    data: { clientName?: string; note?: string },
  ) => apiClient.post<BackendQuotation>(`/quotations/public/${token}/reject`, data),
  publicPdfUrl: (token: string) => `${API_BASE_URL}/quotations/public/${token}/pdf`,
};

export const i18nApi = {
  locales: () => apiClient.get('/i18n/locales'),
  detect: (acceptLanguage?: string) =>
    apiClient.get(`/i18n/detect${buildQuery({ acceptLanguage })}`),
};

export const payoutsApi = {
  razorpay: (data: unknown) => apiClient.post('/razorpay/payout', data),
};

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

export const auditApi = {
  recentActivity: () => apiClient.get('/audit/recent-activity'),
};

export const emailTemplatesApi = {
  create: (data: unknown) => apiClient.post('/email-templates', data),
  list: (params?: { organizationId?: string; key?: string; isActive?: boolean }) =>
    apiClient.get(`/email-templates${buildQuery(params || {})}`),
  getById: (id: string) => apiClient.get(`/email-templates/${id}`),
  update: (id: string, data: unknown) => apiClient.patch(`/email-templates/${id}`, data),
  delete: (id: string) => apiClient.delete(`/email-templates/${id}`),
};

export const invoiceTemplatesApi = {
  create: (data: unknown) => apiClient.post('/invoice-templates', data),
  list: (params?: {
    organizationId?: string;
    key?: string;
    isDefault?: boolean;
    isActive?: boolean;
  }) => apiClient.get(`/invoice-templates${buildQuery(params || {})}`),
  getById: (id: string) => apiClient.get(`/invoice-templates/${id}`),
  update: (id: string, data: unknown) => apiClient.patch(`/invoice-templates/${id}`, data),
  delete: (id: string) => apiClient.delete(`/invoice-templates/${id}`),
};

async function uploadFileToCloudinary(
  file: File,
  payload: SignedUploadPayload,
): Promise<ApiResponse<CloudinaryDirectUploadResponse>> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', payload.apiKey);
  formData.append('timestamp', String(payload.timestamp));
  formData.append('folder', payload.folder);
  formData.append('public_id', payload.publicId);
  formData.append('signature', payload.signature);

  try {
    const response = await fetch(payload.uploadUrl, {
      method: 'POST',
      body: formData,
    });

    const data = (await response.json().catch(() => null)) as
      | CloudinaryDirectUploadResponse
      | { error?: { message?: string } }
      | null;

    if (!response.ok || !data || !('secure_url' in data) || !('public_id' in data)) {
      return {
        success: false,
        error:
          (data && 'error' in data && data.error?.message) ||
          'Cloudinary direct upload failed',
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Cloudinary upload failed',
    };
  }
}

export const uploadsApi = {
  getUserProfilePhotoSignature: (userId: string) =>
    apiClient.post<SignedUploadPayload>(
      `/uploads/users/${userId}/profile-photo/signature`,
    ),

  confirmUserProfilePhoto: (
    userId: string,
    payload: { secureUrl: string; publicId: string },
  ) =>
    apiClient.patch<ConfirmedUploadResponse>(
      `/uploads/users/${userId}/profile-photo/confirm`,
      payload,
    ),

  async uploadUserProfilePhotoDirect(userId: string, file: File) {
    const preparedFile = await processImageBeforeUpload(file, {
      cropSquare: true,
      maxWidth: 512,
      maxHeight: 512,
      quality: 0.85,
      outputType: 'image/webp',
    });

    const signed = await this.getUserProfilePhotoSignature(userId);

    if (!signed.success || !signed.data) {
      return {
        success: false,
        error: signed.error || 'Failed to get upload signature',
      } as ApiResponse<ConfirmedUploadResponse>;
    }

    const uploaded = await uploadFileToCloudinary(preparedFile, signed.data);
    if (!uploaded.success || !uploaded.data) {
      return {
        success: false,
        error: uploaded.error || 'Failed to upload image to Cloudinary',
      } as ApiResponse<ConfirmedUploadResponse>;
    }

    return this.confirmUserProfilePhoto(userId, {
      secureUrl: uploaded.data.secure_url,
      publicId: uploaded.data.public_id,
    });
  },

  deleteUserProfilePhoto: (userId: string) =>
    apiClient.delete<ConfirmedUploadResponse>(
      `/uploads/users/${userId}/profile-photo`,
    ),

  getOrganizationLogoSignature: (organizationId: string) =>
    apiClient.post<SignedUploadPayload>(
      `/uploads/organizations/${organizationId}/logo/signature`,
    ),

  confirmOrganizationLogo: (
    organizationId: string,
    payload: { secureUrl: string; publicId: string },
  ) =>
    apiClient.patch<ConfirmedUploadResponse>(
      `/uploads/organizations/${organizationId}/logo/confirm`,
      payload,
    ),

  async uploadOrganizationLogoDirect(organizationId: string, file: File) {
    const preparedFile = await processImageBeforeUpload(file, {
      maxWidth: 1200,
      maxHeight: 400,
      quality: 0.85,
      outputType: 'image/webp',
    });

    const signed = await this.getOrganizationLogoSignature(organizationId);

    if (!signed.success || !signed.data) {
      return {
        success: false,
        error: signed.error || 'Failed to get upload signature',
      } as ApiResponse<ConfirmedUploadResponse>;
    }

    const uploaded = await uploadFileToCloudinary(preparedFile, signed.data);
    if (!uploaded.success || !uploaded.data) {
      return {
        success: false,
        error: uploaded.error || 'Failed to upload image to Cloudinary',
      } as ApiResponse<ConfirmedUploadResponse>;
    }

    return this.confirmOrganizationLogo(organizationId, {
      secureUrl: uploaded.data.secure_url,
      publicId: uploaded.data.public_id,
    });
  },

  deleteOrganizationLogo: (organizationId: string) =>
    apiClient.delete<ConfirmedUploadResponse>(
      `/uploads/organizations/${organizationId}/logo`,
    ),
};

export const backendApi = {
  auth: authApi,
  organizations: organizationsApi,
  users: usersApi,
  departments: departmentsApi,
  designations: designationsApi,
  locations: locationsApi,
  shifts: shiftsApi,
  timelogs: timelogsApi,
  attendance: attendanceApi,
  leaves: leavesApi,
  holidays: holidaysApi,
  payroll: payrollApi,
  compensation: compensationApi,
  wallets: walletsApi,
  currency: currencyApi,
  notifications: notificationsApi,
  reports: reportsApi,
  scheduler: schedulerApi,
  queue: queueApi,
  performance: performanceApi,
  recruitment: recruitmentApi,
  assets: assetsApi,
  tickets: ticketsApi,
  leads: leadsApi,
  quotations: quotationsApi,
  i18n: i18nApi,
  payouts: payoutsApi,
  subscriptions: subscriptionsApi,
  audit: auditApi,
  emailTemplates: emailTemplatesApi,
  invoiceTemplates: invoiceTemplatesApi,
  uploads: uploadsApi,
  mailbox: mailboxApi,
};

export const dashboardApi = {
  async getStats(): Promise<ApiResponse<DashboardStats>> {
    const [overviewResp, leavesResp] = await Promise.all([
      reportsApi.overview(),
      leavesApi.getAll({ status: 'PENDING' }),
    ]);

    if (!overviewResp.success || !overviewResp.data) {
      return {
        success: false,
        error: overviewResp.error || 'Failed to fetch dashboard overview',
      };
    }

    const overview = overviewResp.data as {
      users: number;
      leaves: number;
      timelogs: number;
    };

    const pendingLeaveRequests =
      leavesResp.success && Array.isArray(leavesResp.data) ? leavesResp.data.length : 0;
    return {
      success: true,
      data: {
        totalEmployees: overview.users ?? 0,
        presentToday: 0,
        onLeave: 0,
        absentToday: 0,
        pendingLeaveRequests,
        pendingTimesheets: Math.max(0, overview.timelogs ?? 0),
      },
    };
  },

  async getRecentActivities() {
    return auditApi.recentActivity();
  },
};

export const employeeApi = {
  getAll: () => usersApi.getAll(),
  getById: (id: string) => usersApi.getById(id),
  create: (data: unknown) => usersApi.create(data),
  update: (id: string, data: unknown) => usersApi.update(id, data),
  delete: (id: string) => usersApi.delete(id),
};

export const leaveApi = {
  getAll: (status?: string) => leavesApi.getAll({ status }),
  getById: (id: string) => leavesApi.getById(id),
  create: (data: unknown) => leavesApi.apply(data),
  update: (id: string, data: unknown) => leavesApi.update(id, data),
  approve: (id: string, actorUserId: string) => leavesApi.approve(id, actorUserId),
  reject: (id: string, actorUserId: string, reason: string) =>
    leavesApi.reject(id, actorUserId, reason),
  delete: (id: string) => leavesApi.delete(id),
};

export const timesheetApi = {
  getAll: (userId?: string) => timelogsApi.getAll(userId),
  getById: (id: string) => timelogsApi.getById(id),
  create: (data: unknown) => timelogsApi.create(data),
  update: (id: string, data: unknown) => timelogsApi.update(id, data),
  delete: (id: string) => timelogsApi.delete(id),
};

export function mapBackendUserToAuthUser(user: BackendUser): User {
  return {
    id: user.id,
    email: user.email,
    avatarUrl: user.avatarUrl || undefined,
    firstName: user.firstName,
    lastName: user.lastName,
    name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
    role: user.role,
    organizationId: user.organizationId,
  };
}

export function mapBackendUserToEmployee(user: BackendUser): Employee {
  return {
    id: user.id,
    name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
    email: user.email,
    avatarUrl: user.avatarUrl || undefined,
    department: user.departmentId || 'Unassigned',
    position: user.role,
    joinDate: user.joiningDate || new Date().toISOString(),
    status: user.status === 'INACTIVE' ? 'inactive' : 'active',
    employeeId: user.employeeId,
    organizationId: user.organizationId,
    departmentId: user.departmentId,
    designationId: user.designationId,
    locationId: user.locationId,
    managerId: user.managerId,
  };
}

const leaveTypeMap: Record<string, LeaveRequest['type']> = {
  SICK: 'sick',
  CASUAL: 'personal',
  EARNED: 'vacation',
  MATERNITY: 'personal',
  PATERNITY: 'personal',
  BEREAVEMENT: 'personal',
  MARRIAGE: 'personal',
  UNPAID: 'unpaid',
  COMP_OFF: 'vacation',
};

export function mapBackendLeaveToUi(leave: BackendLeave): LeaveRequest {
  return {
    id: leave.id,
    employeeId: leave.userId,
    type: leaveTypeMap[leave.leaveType] || 'personal',
    startDate: leave.startDate,
    endDate: leave.endDate,
    reason: leave.reason,
    status:
      leave.status === 'APPROVED'
        ? 'approved'
        : leave.status === 'REJECTED'
          ? 'rejected'
          : 'pending',
    submittedAt: leave.createdAt,
    approvedAt: leave.approvedAt || undefined,
    approverName: leave.approvedById || undefined,
  };
}

export function mapBackendTimelogToUi(entry: BackendTimeLog): TimesheetEntry {
  const startDate = new Date(entry.clockIn);
  const endDate = entry.clockOut ? new Date(entry.clockOut) : startDate;

  return {
    id: entry.id,
    employeeId: entry.userId,
    date: startDate.toISOString().slice(0, 10),
    startTime: startDate.toISOString().slice(11, 16),
    endTime: endDate.toISOString().slice(11, 16),
    hoursWorked: entry.totalHours ?? 0,
    overtime: entry.overtimeHours ?? 0,
    status:
      entry.status === 'APPROVED'
        ? 'approved'
        : entry.status === 'INVOICED'
          ? 'approved'
        : entry.status === 'REJECTED'
          ? 'rejected'
          : 'pending',
    notes: entry.notes ?? undefined,
  };
}