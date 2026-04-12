import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role, TicketPriority, TicketStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { QueueService } from '../../queue/services/queue.service';
import { AssignTicketDto } from '../dto/assign-ticket.dto';
import { CreateTicketCommentDto } from '../dto/create-ticket-comment.dto';
import { CreateTicketDto } from '../dto/create-ticket.dto';
import { TicketActorQueryDto } from '../dto/ticket-actor-query.dto';
import { TicketsQueryDto } from '../dto/tickets-query.dto';
import { UpdateTicketStatusDto } from '../dto/update-ticket-status.dto';

@Injectable()
export class TicketsService {
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
    TicketStatus.OPEN,
    TicketStatus.ASSIGNED,
  ]);

  constructor(
    private readonly prisma: PrismaService,
    private readonly queueService: QueueService,
  ) {}

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
      orderBy: [{ status: 'asc' }, { updatedAt: 'desc' }],
      take: query.limit ?? 200,
    });
  }

  async findOne(id: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
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
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
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
        priority: dto.priority ?? TicketPriority.MEDIUM,
        status: dto.assigneeId ? TicketStatus.ASSIGNED : TicketStatus.OPEN,
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

    return this.findOne(ticket.id);
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

    return this.findOne(ticketId);
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
    const note = dto.resolutionNote?.trim();

    if (isTerminal && !note) {
      throw new BadRequestException(
        'resolutionNote is required for RESOLVED, FAILED, or TIMED_OUT status',
      );
    }

    await this.prisma.$transaction([
      this.prisma.ticket.update({
        where: { id: ticketId },
        data: {
          status: dto.status,
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

    return this.findOne(ticketId);
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
}
