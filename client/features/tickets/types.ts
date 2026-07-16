import { TicketPriority, TicketStatus } from '@/lib/types';

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
  assignedAt?: string | null;
  resolutionNote?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  requester?: BackendTicketUser;
  assignee?: BackendTicketUser | null;
}

export interface CreateTicketPayload {
  organizationId: string;
  requesterId: string;
  title: string;
  description: string;
  priority?: TicketPriority;
  assigneeId?: string;
}

export interface AssignTicketPayload {
  actorUserId: string;
  assigneeId: string;
  status?: TicketStatus;
}

export interface UpdateTicketStatusPayload {
  actorUserId: string;
  status: TicketStatus;
  resolutionNote?: string;
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

export interface AddTicketCommentPayload {
  actorUserId: string;
  body: string;
}
