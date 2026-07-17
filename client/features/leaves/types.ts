export type LeaveType =
  | 'SICK'
  | 'VACATION'
  | 'PERSONAL'
  | 'MATERNITY'
  | 'PATERNITY'
  | 'UNPAID'
  | 'OTHER';

export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export interface BackendLeave {
  id: string;
  userId: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string | null;
  status: LeaveStatus;
  appliedToId: string | null;
  approvedById: string | null;
  approvedAt: string | null;
  rejectionReason: string | null;
  isHalfDay: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLeavePayload {
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason?: string;
  appliedToId?: string;
  isHalfDay?: boolean;
}

export interface UpdateLeavePayload {
  leaveType?: LeaveType;
  startDate?: string;
  endDate?: string;
  reason?: string;
  appliedToId?: string;
  isHalfDay?: boolean;
}

export interface LeaveApprovalPayload {
  reason?: string;
}

export interface LeaveRejectionPayload {
  reason: string;
}

export interface LeaveCancelPayload {
  reason?: string;
}

export interface LeavesQueryFilters {
  userId?: string;
  approverId?: string;
  status?: LeaveStatus;
}
