export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';

export type LeaveType =
  | 'SICK'
  | 'CASUAL'
  | 'EARNED'
  | 'MATERNITY'
  | 'PATERNITY'
  | 'UNPAID';

export interface LeaveRequest {
  id: string;
  employeeName: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedOn: string;
}

export interface BackendLeave {
  id: string;
  userId: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason: string | null;
  status: LeaveStatus;
  reviewerId: string | null;
  rejectionReason: string | null;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    firstName?: string;
    lastName?: string;
    email: string;
  };
  reviewer?: {
    firstName?: string;
    lastName?: string;
    email: string;
  };
}

export interface CreateLeavePayload {
  userId: string;
  organizationId: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  reason?: string;
}

export interface UpdateLeaveStatusPayload {
  actorUserId: string;
  status: LeaveStatus;
  rejectionReason?: string;
}
