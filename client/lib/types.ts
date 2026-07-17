import { ReactNode } from 'react';

export type UserRole =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'HR_MANAGER'
  | 'MANAGER'
  | 'EMPLOYEE'
  | 'INTERN';

export type UserStatus =
  | 'ACTIVE'
  | 'INACTIVE'
  | 'ON_LEAVE'
  | 'TERMINATED'
  | 'RESIGNED'
  | 'PROBATION';

export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
export type LeaveType =
  | 'SICK'
  | 'CASUAL'
  | 'EARNED'
  | 'MATERNITY'
  | 'PATERNITY'
  | 'BEREAVEMENT'
  | 'MARRIAGE'
  | 'UNPAID'
  | 'COMP_OFF';

export type TimeLogStatus =
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'INVOICED';

export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type TicketStatus =
  | 'OPEN'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'FAILED'
  | 'TIMED_OUT';

export type LeadStatus =
  | 'NEW'
  | 'CONTACTED'
  | 'QUALIFIED'
  | 'PROPOSAL'
  | 'QUOTED'
  | 'WON'
  | 'LOST';

export type QuotationStatus =
  | 'DRAFT'
  | 'SENT'
  | 'APPROVED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'EXPIRED';

export type BillingProvider = 'STRIPE' | 'RAZORPAY';
export type SubscriptionInterval = 'MONTHLY' | 'YEARLY';
export type OrganizationSubscriptionStatus =
  | 'TRIALING'
  | 'ACTIVE'
  | 'PAST_DUE'
  | 'CANCELED'
  | 'EXPIRED';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  role: UserRole;
  organizationId?: string;
  avatarUrl?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
}

export interface BackendUser {
  name: ReactNode;
  id: string;
  email: string;
  avatarUrl?: string | null;
  firstName: string;
  lastName: string;
  role: UserRole;
  status?: UserStatus;
  employeeId?: string;
  organizationId?: string;
  departmentId?: string | null;
  designationId?: string | null;
  locationId?: string | null;
  managerId?: string | null;
  joiningDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone?: string;
  department: string;
  position: string;
  joinDate: string;
  salary?: number;
  avatarUrl?: string;
  status: 'active' | 'inactive';
  employeeId?: string;
  organizationId?: string;
  departmentId?: string | null;
  designationId?: string | null;
  locationId?: string | null;
  managerId?: string | null;
}

export interface TimesheetEntry {
  id: string;
  employeeId: string;
  date: string;
  startTime: string;
  endTime: string;
  hoursWorked: number;
  overtime: number;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
}

export interface BackendTimeLog {
  id: string;
  userId: string;
  clockIn: string;
  clockOut?: string | null;
  totalHours?: number | null;
  overtimeHours?: number | null;
  status: TimeLogStatus;
  notes?: string | null;
  createdAt?: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  type: 'vacation' | 'sick' | 'personal' | 'unpaid';
  startDate: string;
  endDate: string;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  approvedAt?: string;
  approverName?: string;
}

export interface BackendLeave {
  id: string;
  userId: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: LeaveStatus;
  approvedAt?: string | null;
  approvedById?: string | null;
  createdAt: string;
}

export interface BackendTicketUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface BackendTicket {
  id: string;
  organizationId: string;
  requesterId: string;
  assigneeId?: string | null;
  assignedById?: string | null;
  title: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  orderIndex: number;
  assignedAt?: string | null;
  resolutionNote?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  requester?: BackendTicketUser;
  assignee?: BackendTicketUser | null;
}

export interface BackendTicketComment {
  id: string;
  ticketId: string;
  authorId: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  author?: BackendTicketUser;
}

export interface BackendTicketStatusEvent {
  id: string;
  ticketId: string;
  actorUserId: string;
  fromStatus?: TicketStatus | null;
  toStatus: TicketStatus;
  note?: string | null;
  createdAt: string;
  actorUser?: BackendTicketUser;
}

export interface BackendLead {
  id: string;
  organizationId: string;
  createdById?: string | null;
  name: string;
  company: string;
  email: string;
  phone?: string | null;
  source?: string | null;
  notes?: string | null;
  status: LeadStatus;
  expectedAmount?: number | null;
  currency: string;
  createdAt: string;
  updatedAt: string;
  quotations?: BackendQuotation[];
}

export interface BackendQuotationStatusEvent {
  id: string;
  quotationId: string;
  actorUserId?: string | null;
  actorLabel?: string | null;
  fromStatus?: QuotationStatus | null;
  toStatus: QuotationStatus;
  note?: string | null;
  createdAt: string;
}

export interface QuotationLineItem {
  title: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  taxPercent?: number;
  discountPercent?: number;
  lineBase?: number;
  lineTotal?: number;
}

export interface QuotationDesigner {
  companyDisplayName?: string;
  logoUrl?: string;
  primaryColor?: string;
  accentColor?: string;
  headerHtml?: string;
  footerHtml?: string;
}

export interface BackendQuotation {
  id: string;
  organizationId: string;
  leadId: string;
  quoteNumber: string;
  publicToken: string;
  title: string;
  description: string;
  amount: number;
  currency: string;
  taxPercent: number;
  discountPercent: number;
  totalAmount: number;
  validUntil?: string | null;
  status: QuotationStatus;
  sentAt?: string | null;
  respondedAt?: string | null;
  approvedAt?: string | null;
  rejectedAt?: string | null;
  approvalNote?: string | null;
  rejectionNote?: string | null;
  lineItems?: QuotationLineItem[] | null;
  designer?: QuotationDesigner | null;
  createdById: string;
  updatedById?: string | null;
  createdAt: string;
  updatedAt: string;
  lead?: BackendLead;
  events?: BackendQuotationStatusEvent[];
}

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

export interface Department {
  id: string;
  organizationId?: string;
  name: string;
  code?: string;
  description?: string;
  managerId?: string;
  memberCount: number;
  parentId?: string;
  parent?: {
    id: string;
    name: string;
  };
  manager?: {
    id: string;
    name: string;
  };
}

export interface BackendOrganization {
  id: string;
  name: string;
  country: string;
  currency?: string;
  timezone?: string;
  logoUrl?: string | null;
}

export interface SignedUploadPayload {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  publicId: string;
  signature: string;
  uploadUrl: string;
}

export interface ConfirmedUploadResponse {
  publicId?: string;
  avatarUrl?: string | null;
  logoUrl?: string | null;
  userId?: string;
  organizationId?: string;
  removed?: boolean;
}

export interface DashboardStats {
  totalEmployees: number;
  presentToday: number;
  onLeave: number;
  absentToday: number;
  pendingLeaveRequests: number;
  pendingTimesheets: number;
}

export type DashboardPeriod = 'monthly' | 'yearly' | 'overall';

export interface DashboardChartPoint {
  label: string;
  value: number;
}

export interface DashboardDistributionPoint extends DashboardChartPoint {
  color: string;
}

export interface DashboardChartsData {
  period: DashboardPeriod;
  currency: string;
  attendanceTrend: DashboardChartPoint[];
  workload: DashboardChartPoint[];
  departmentDistribution: DashboardDistributionPoint[];
  salaryDistribution: DashboardDistributionPoint[];
  totalSalary: number;
  generatedAt: string;
}

export interface ApiResponse<T> {
  id: any;
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  user: BackendUser;
}

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
