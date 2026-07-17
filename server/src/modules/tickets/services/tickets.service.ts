import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  OnModuleInit,
  Logger,
} from '@nestjs/common';
import { Role, TicketPriority, TicketStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { QueueService } from '../../queue/services/queue.service';
import { AssignTicketDto } from '../dto/assign-ticket.dto';
import { CreateTicketCommentDto } from '../dto/create-ticket-comment.dto';
import { CreateTicketDto } from '../dto/create-ticket.dto';
import { UpdateTicketDetailsDto } from '../dto/update-ticket-details.dto';
import { TicketActorQueryDto } from '../dto/ticket-actor-query.dto';
import * as crypto from 'crypto';
import { TicketsQueryDto } from '../dto/tickets-query.dto';
import { UpdateTicketStatusDto } from '../dto/update-ticket-status.dto';
import { TicketsGateway } from '../gateways/tickets.gateway';

@Injectable()
export class TicketsService implements OnModuleInit {
  private readonly logger = new Logger(TicketsService.name);

  // SLA Thresholds in hours
  private readonly SLA_THRESHOLDS = {
    [TicketPriority.CRITICAL]: { assign: 1, resolve: 4 },
    [TicketPriority.HIGH]: { assign: 4, resolve: 24 },
    [TicketPriority.MEDIUM]: { assign: 24, resolve: 72 },
    [TicketPriority.LOW]: { assign: 48, resolve: 120 },
  };

  private readonly adminRoles = new Set<Role>([
    Role.SUPER_ADMIN,
    Role.ADMIN,
    Role.HR_MANAGER,
  ]);

  private readonly terminalStatuses = new Set<TicketStatus>([
    TicketStatus.RESOLVED,
    TicketStatus.FAILED,
    TicketStatus.TIMED_OUT,
  ]);

  private readonly assignableStatuses = new Set<TicketStatus>([
    TicketStatus.ASSIGNED,
    TicketStatus.IN_PROGRESS,
  ]);

  private readonly restrictedSupportStatuses = new Set<TicketStatus>([
    TicketStatus.ASSIGNED,
  ]);

  constructor(
    private readonly prisma: PrismaService,
    private readonly queueService: QueueService,
    private readonly ticketsGateway: TicketsGateway,
  ) {}

  onModuleInit() {
    this.queueService.registerHandler('tickets.check-sla', async () => {
      await this.processSlaBreaches();
    });
  }

  async processSlaBreaches() {
    this.logger.log('Starting SLA Engine check...');
    
    // Check OPEN tickets for Assignment SLA
    const openTickets = await this.prisma.ticket.findMany({
      where: { status: TicketStatus.OPEN },
    });
    
    for (const ticket of openTickets) {
      const thresholds = this.SLA_THRESHOLDS[ticket.priority];
      const limitHours = thresholds.assign;
      const elapsedHours = (Date.now() - ticket.createdAt.getTime()) / (1000 * 60 * 60);
      
      if (elapsedHours > limitHours) {
        await this.handleSlaBreach(ticket, `Time to Assign SLA Breached (${limitHours}h limit)`);
      }
    }
    
    // Check ASSIGNED/IN_PROGRESS tickets for Resolution SLA
    const activeTickets = await this.prisma.ticket.findMany({
      where: { status: { in: [TicketStatus.ASSIGNED, TicketStatus.IN_PROGRESS] } },
    });
    
    for (const ticket of activeTickets) {
      const thresholds = this.SLA_THRESHOLDS[ticket.priority];
      const limitHours = thresholds.resolve;
      const elapsedHours = (Date.now() - ticket.createdAt.getTime()) / (1000 * 60 * 60);
      
      if (elapsedHours > limitHours) {
        await this.handleSlaBreach(ticket, `Time to Resolve SLA Breached (${limitHours}h limit)`);
      }
    }
    
    this.logger.log('SLA Engine check completed.');
  }

  private async handleSlaBreach(ticket: any, note: string) {
    await this.prisma.$transaction([
      this.prisma.ticket.update({
        where: { id: ticket.id },
        data: { status: TicketStatus.TIMED_OUT },
      }),
      this.prisma.ticketStatusEvent.create({
        data: {
          ticketId: ticket.id,
          actorUserId: ticket.requesterId,
          fromStatus: ticket.status,
          toStatus: TicketStatus.TIMED_OUT,
          note: note,
        },
      }),
    ]);
    
    await this.queueService.enqueue({
      type: 'notification.send',
      payload: {
        userId: ticket.assigneeId || ticket.requesterId,
        channel: 'in-app',
        title: 'Ticket SLA Breached!',
        message: `Ticket ${ticket.title} was marked as TIMED_OUT: ${note}`,
        locale: 'en',
        metadata: { ticketId: ticket.id, status: TicketStatus.TIMED_OUT },
      },
    });

    const updatedTicket = await this.findOne(ticket.id);
    if (updatedTicket) {
      this.ticketsGateway.broadcastTicketUpdate(ticket.organizationId, 'ticket.updated', updatedTicket);
    }
    this.logger.warn(`Ticket ${ticket.id} SLA breached: ${note}`);
  }

  findAll(query: TicketsQueryDto) {
    return this.prisma.ticket.findMany({
      where: {
        ...(query.organizationId ? { organizationId: query.organizationId } : {}),
        ...(query.requesterId ? { requesterId: query.requesterId } : {}),
        ...(query.assigneeId ? { assigneeId: query.assigneeId } : {}),
        ...(query.status ? { status: query.status } : {}),
        ...(query.priority ? { priority: query.priority } : {}),
      },
      include: {
        requester: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        assignee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: [{ orderIndex: 'asc' }, { createdAt: 'desc' }],
      take: query.limit ?? 200,
    });
  }

  async findOne(id: string, organizationId?: string) {
    const ticket = await this.prisma.ticket.findFirst({
      where: {
        id,
        ...(organizationId ? { organizationId } : {}),
      },
      include: {
        requester: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
        assignee: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
        assignedBy: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
      },
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket with ID ${id} not found`);
    }

    return ticket;
  }

  async findOneBySlug(slug: string, organizationId?: string) {
    const ticket = await this.prisma.ticket.findFirst({
      where: { 
        slug,
        ...(organizationId ? { organizationId } : {}),
      },
      include: {
        requester: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
        assignee: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
        assignedBy: { select: { id: true, firstName: true, lastName: true, email: true, role: true } },
      },
    });

    if (!ticket) {
      throw new NotFoundException(`Ticket with slug ${slug} not found`);
    }

    return ticket;
  }

  async create(dto: CreateTicketDto) {
    await this.ensureOrganizationExists(dto.organizationId);

    const requester = await this.getUserOrThrow(dto.requesterId);
    this.ensureUserInOrganization(requester.organizationId, dto.organizationId);

    if (dto.assigneeId) {
      const assignee = await this.getUserOrThrow(dto.assigneeId);
      this.ensureUserInOrganization(assignee.organizationId, dto.organizationId);
    }

    const ticket = await this.prisma.ticket.create({
      data: {
        organizationId: dto.organizationId,
        requesterId: dto.requesterId,
        assigneeId: dto.assigneeId,
        title: dto.title,
        description: dto.description,
        slug: `TKT-${crypto.randomBytes(3).toString('hex').toUpperCase()}`,
        priority: dto.priority ?? TicketPriority.MEDIUM,
        status: dto.status ?? (dto.assigneeId ? TicketStatus.ASSIGNED : TicketStatus.OPEN),
        assignedAt: dto.assigneeId ? new Date() : null,
      },
    });

    await this.prisma.ticketStatusEvent.create({
      data: {
        ticketId: ticket.id,
        actorUserId: dto.requesterId,
        fromStatus: null,
        toStatus: ticket.status,
        note: dto.assigneeId
          ? 'Ticket created and assigned'
          : 'Ticket created',
      },
    });

    await this.queueService.enqueue({
      type: 'notification.send',
      payload: {
        userId: ticket.requesterId,
        channel: 'in-app',
        title: 'Ticket created',
        message: `Ticket ${ticket.title} has been created.`,
        locale: 'en',
        metadata: { ticketId: ticket.id, status: ticket.status },
      },
    });

    if (ticket.assigneeId) {
      await this.queueService.enqueue({
        type: 'notification.send',
        payload: {
          userId: ticket.assigneeId,
          channel: 'in-app',
          title: 'Ticket assigned',
          message: `You have been assigned ticket: ${ticket.title}`,
          locale: 'en',
          metadata: { ticketId: ticket.id, status: ticket.status },
        },
      });
    }

    const updatedTicket = await this.findOne(ticket.id);
    if (updatedTicket) {
      this.ticketsGateway.broadcastTicketUpdate(dto.organizationId, 'ticket.created', updatedTicket);
    }
    return updatedTicket;
  }

  async assign(ticketId: string, dto: AssignTicketDto) {
    const [ticket, actor, assignee] = await Promise.all([
      this.findOne(ticketId),
      this.getUserOrThrow(dto.actorUserId),
      this.getUserOrThrow(dto.assigneeId),
    ]);

    this.ensureUserInOrganization(actor.organizationId, ticket.organizationId);
    this.ensureUserInOrganization(assignee.organizationId, ticket.organizationId);

    if (!this.adminRoles.has(actor.role)) {
      throw new ForbiddenException('Only admin users can assign tickets');
    }

    const nextStatus = dto.status ?? TicketStatus.ASSIGNED;
    if (!this.assignableStatuses.has(nextStatus)) {
      throw new BadRequestException('assign endpoint only supports ASSIGNED or IN_PROGRESS');
    }

    const assignedAt = ticket.assignedAt ?? new Date();

    await this.prisma.$transaction([
      this.prisma.ticket.update({
        where: { id: ticketId },
        data: {
          assigneeId: assignee.id,
          assignedById: actor.id,
          status: nextStatus,
          assignedAt,
          resolvedAt: null,
          resolutionNote: null,
        },
      }),
      this.prisma.ticketStatusEvent.create({
        data: {
          ticketId,
          actorUserId: actor.id,
          fromStatus: ticket.status,
          toStatus: nextStatus,
          note: `Assigned to ${assignee.firstName}`,
        },
      }),
    ]);

    await this.queueService.enqueue({
      type: 'notification.send',
      payload: {
        userId: assignee.id,
        channel: 'in-app',
        title: 'Ticket assigned to you',
        message: `${actor.firstName} assigned ticket: ${ticket.title}`,
        locale: 'en',
        metadata: { ticketId: ticketId, status: nextStatus },
      },
    });

    const updatedTicket = await this.findOne(ticketId);
    if (updatedTicket) {
      this.ticketsGateway.broadcastTicketUpdate(ticket.organizationId, 'ticket.updated', updatedTicket);
    }
    return updatedTicket;
  }

  async updateDetails(ticketId: string, dto: UpdateTicketDetailsDto) {
    const access = await this.assertTicketAccess(ticketId, dto.actorUserId);

    if (!access.isRequester && !access.isAdmin) {
      throw new ForbiddenException('Only the ticket creator or admin can edit the ticket details');
    }

    await this.prisma.$transaction([
      this.prisma.ticket.update({
        where: { id: ticketId },
        data: {
          title: dto.title,
          description: dto.description,
        },
      }),
      this.prisma.ticketStatusEvent.create({
        data: {
          ticketId,
          actorUserId: dto.actorUserId,
          toStatus: access.ticket.status,
          note: 'Updated ticket details',
        },
      }),
    ]);

    const updatedTicket = await this.findOne(ticketId, access.ticket.organizationId);
    if (updatedTicket) {
      this.ticketsGateway.broadcastTicketUpdate(access.ticket.organizationId, 'ticket.updated', updatedTicket);
    }
    return updatedTicket;
  }

  async updateStatus(ticketId: string, dto: UpdateTicketStatusDto) {
    const [ticket, actor] = await Promise.all([
      this.findOne(ticketId),
      this.getUserOrThrow(dto.actorUserId),
    ]);

    this.ensureUserInOrganization(actor.organizationId, ticket.organizationId);

    const isAdmin = this.adminRoles.has(actor.role);
    const isAssignee = ticket.assigneeId === actor.id;

    if (!isAdmin && !isAssignee) {
      throw new ForbiddenException('Only assigned support user or admin can update ticket status');
    }

    if (!isAdmin && this.restrictedSupportStatuses.has(dto.status)) {
      throw new ForbiddenException('Support assignee cannot move ticket back to OPEN or ASSIGNED');
    }

    const isTerminal = this.terminalStatuses.has(dto.status);
    const note = dto.resolutionNote?.trim() || null;

    await this.prisma.$transaction([
      this.prisma.ticket.update({
        where: { id: ticketId },
        data: {
          status: dto.status,
          assigneeId: dto.status === TicketStatus.OPEN ? null : undefined,
          assignedAt: dto.status === TicketStatus.OPEN ? null : undefined,
          resolvedAt: isTerminal ? new Date() : null,
          resolutionNote: isTerminal ? note : null,
        },
      }),
      this.prisma.ticketStatusEvent.create({
        data: {
          ticketId,
          actorUserId: actor.id,
          fromStatus: ticket.status,
          toStatus: dto.status,
          note,
        },
      }),
    ]);

    await this.queueService.enqueue({
      type: 'notification.send',
      payload: {
        userId: ticket.requesterId,
        channel: 'in-app',
        title: 'Ticket status updated',
        message: `Ticket ${ticket.title} is now ${dto.status}.`,
        locale: 'en',
        metadata: {
          ticketId: ticket.id,
          previousStatus: ticket.status,
          status: dto.status,
        },
      },
    });

    const updatedTicket = await this.findOne(ticketId);
    if (updatedTicket) {
      this.ticketsGateway.broadcastTicketUpdate(ticket.organizationId, 'ticket.updated', updatedTicket);
    }
    return updatedTicket;
  }

  async listComments(ticketId: string, query: TicketActorQueryDto) {
    await this.assertTicketAccess(ticketId, query.actorUserId);

    return this.prisma.ticketComment.findMany({
      where: { ticketId },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
      take: query.limit ?? 200,
    });
  }

  async addComment(ticketId: string, dto: CreateTicketCommentDto) {
    const access = await this.assertTicketAccess(ticketId, dto.actorUserId);

    if (!access.isAdmin && !access.isRequester && !access.isAssignee) {
      throw new ForbiddenException('Only requester, assignee, or admin can comment');
    }

    const [comment] = await this.prisma.$transaction([
      this.prisma.ticketComment.create({
        data: {
          ticketId,
          authorId: dto.actorUserId,
          body: dto.body.trim(),
        },
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      }),
      this.prisma.ticket.update({
        where: { id: ticketId },
        data: { updatedAt: new Date() },
      }),
    ]);

    return comment;
  }

  async statusHistory(ticketId: string, query: TicketActorQueryDto) {
    await this.assertTicketAccess(ticketId, query.actorUserId);

    return this.prisma.ticketStatusEvent.findMany({
      where: { ticketId },
      include: {
        actorUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: query.limit ?? 300,
    });
  }

  private async ensureOrganizationExists(organizationId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { id: true },
    });

    if (!org) {
      throw new NotFoundException('Organization not found');
    }
  }

  private async getUserOrThrow(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        role: true,
        organizationId: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User not found: ${userId}`);
    }

    return user;
  }

  private async assertTicketAccess(ticketId: string, actorUserId: string) {
    const [ticket, actor] = await Promise.all([
      this.prisma.ticket.findUnique({
        where: { id: ticketId },
        select: {
          id: true,
          organizationId: true,
          requesterId: true,
          assigneeId: true,
          status: true,
        },
      }),
      this.getUserOrThrow(actorUserId),
    ]);

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    this.ensureUserInOrganization(actor.organizationId, ticket.organizationId);

    const isAdmin = this.adminRoles.has(actor.role);
    const isRequester = ticket.requesterId === actor.id;
    const isAssignee = ticket.assigneeId === actor.id;

    if (!isAdmin && !isRequester && !isAssignee) {
      throw new ForbiddenException('You do not have access to this ticket');
    }

    return {
      ticket,
      actor,
      isAdmin,
      isRequester,
      isAssignee,
    };
  }

  private ensureUserInOrganization(userOrganizationId: string, organizationId: string) {
    if (userOrganizationId !== organizationId) {
      throw new BadRequestException('User must belong to the same organization');
    }
  }

  async reorderTickets(organizationId: string, updates: { id: string; orderIndex: number }[]) {
    const res = await this.prisma.$transaction(
      updates.map((update) =>
        this.prisma.ticket.updateMany({
          where: { id: update.id, organizationId },
          data: { orderIndex: update.orderIndex },
        }),
      ),
    );
    this.ticketsGateway.broadcastTicketUpdate(organizationId, 'tickets.reordered', updates);
    return res;
  }

  async swapTickets(organizationId: string, ticket1Id: string, ticket2Id: string) {
    const [t1, t2] = await Promise.all([
      this.prisma.ticket.findFirst({ where: { id: ticket1Id, organizationId } }),
      this.prisma.ticket.findFirst({ where: { id: ticket2Id, organizationId } }),
    ]);

    if (!t1 || !t2) {
      throw new NotFoundException('One or both tickets not found');
    }

    const res = await this.prisma.$transaction([
      this.prisma.ticket.update({
        where: { id: t1.id },
        data: { orderIndex: t2.orderIndex },
      }),
      this.prisma.ticket.update({
        where: { id: t2.id },
        data: { orderIndex: t1.orderIndex },
      }),
    ]);
    
    this.ticketsGateway.broadcastTicketUpdate(organizationId, 'tickets.swapped', {
      ticket1: { id: t1.id, orderIndex: t2.orderIndex },
      ticket2: { id: t2.id, orderIndex: t1.orderIndex },
    });
    
    return res;
  }
}
