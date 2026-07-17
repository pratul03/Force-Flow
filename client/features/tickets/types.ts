import { TicketPriority, TicketStatus } from '@/lib/types';

export interface BackendTicketUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface BackendTicket {
  id: string;
  slug: string;
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

export interface CreateTicketPayload {
  organizationId: string;
  requesterId: string;
  title: string;
  description: string;
  priority?: TicketPriority;
  assigneeId?: string;
  status?: TicketStatus;
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

export type AddTicketCommentPayload = {
  body: string;
};

export type TicketReorderItemPayload = {
  id: string;
  orderIndex: number;
};

export interface ReorderTicketsPayload {
  updates: Array<{ id: string; orderIndex: number }>;
}

export interface UpdateTicketDetailsPayload {
  title: string;
  description: string;
}

export type SwapTicketsPayload = {
  ticket1Id: string;
  ticket2Id: string;
};
