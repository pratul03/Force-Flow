import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { LeaveStatus, Role } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { QueueService } from '../../queue/services/queue.service';
import { CreateLeaveDto } from '../dto/create-leave.dto';
import { LeaveApprovalDto } from '../dto/leave-approval.dto';
import { LeaveCancelDto } from '../dto/leave-cancel.dto';
import { LeaveRejectionDto } from '../dto/leave-rejection.dto';
import { LeavesQueryDto } from '../dto/leaves-query.dto';
import { UpdateLeaveDto } from '../dto/update-leave.dto';

@Injectable()
export class LeavesService {
  private readonly elevatedRoles = new Set<Role>([
    Role.SUPER_ADMIN,
    Role.ADMIN,
    Role.HR_MANAGER,
    Role.MANAGER,
  ]);

  constructor(
    private readonly prisma: PrismaService,
    private readonly queueService: QueueService,
  ) {}

  create(
    dto: CreateLeaveDto,
    actor: { sub: string; organizationId: string; role: string },
  ) {
    return this.apply(dto, actor);
  }

  async apply(
    dto: CreateLeaveDto,
    actor: { sub: string; organizationId: string; role: string },
  ) {
    await this.assertUserAccess(dto.userId, actor);

    if (dto.appliedToId) {
      await this.assertUserInOrganization(dto.appliedToId, actor.organizationId);
    }

    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    if (endDate.getTime() < startDate.getTime()) {
      throw new BadRequestException('endDate must be on or after startDate');
    }

    const totalDays =
      dto.totalDays ?? this.computeWorkingDays(startDate, endDate, dto.isHalfDay ?? false);

    const leave = await this.prisma.leave.create({
      data: {
        userId: dto.userId,
        leaveType: dto.leaveType,
        startDate,
        endDate,
        totalDays,
        reason: dto.reason,
        status: dto.status ?? LeaveStatus.PENDING,
        appliedToId: dto.appliedToId,
        isHalfDay: dto.isHalfDay ?? false,
      },
    });

    await this.queueService.enqueue({
      type: 'notification.send',
      payload: {
        userId: dto.userId,
        channel: 'in-app',
        title: 'Leave request submitted',
        message: `Your leave request (${leave.leaveType}) has been submitted for approval.`,
        locale: 'en',
        metadata: { leaveId: leave.id, status: leave.status },
      },
    });

    if (leave.appliedToId) {
      await this.queueService.enqueue({
        type: 'notification.send',
        payload: {
          userId: leave.appliedToId,
          channel: 'in-app',
          title: 'Leave approval pending',
          message: `A new leave request needs your review.`,
          locale: 'en',
          metadata: { leaveId: leave.id, requesterId: leave.userId },
        },
      });
    }

    return leave;
  }

  async findAll(
    query: LeavesQueryDto,
    actor: { sub: string; organizationId: string; role: string },
  ) {
    const scopedUserId = query.userId ?? this.defaultUserScope(actor);

    if (scopedUserId) {
      await this.assertUserAccess(scopedUserId, actor);
    }

    if (query.approverId) {
      await this.assertUserAccess(query.approverId, actor);
    }

    return this.prisma.leave.findMany({
      where: {
        user: { organizationId: actor.organizationId },
        ...(scopedUserId ? { userId: scopedUserId } : {}),
        ...(query.approverId ? { appliedToId: query.approverId } : {}),
        ...(query.status ? { status: query.status } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async pending(
    approverId: string | undefined,
    actor: { sub: string; organizationId: string; role: string },
  ) {
    const scopedApproverId =
      approverId ?? (this.elevatedRoles.has(actor.role as Role) ? undefined : actor.sub);

    if (scopedApproverId) {
      await this.assertUserAccess(scopedApproverId, actor);
    }

    return this.prisma.leave.findMany({
      where: {
        user: { organizationId: actor.organizationId },
        status: LeaveStatus.PENDING,
        ...(scopedApproverId ? { appliedToId: scopedApproverId } : {}),
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(
    id: string,
    actor: { sub: string; organizationId: string; role: string },
  ) {
    const leave = await this.prisma.leave.findFirst({
      where: {
        id,
        user: {
          organizationId: actor.organizationId,
        },
      },
    });

    if (!leave) {
      throw new NotFoundException('Leave request not found');
    }

    return leave;
  }

  async update(
    id: string,
    dto: UpdateLeaveDto,
    actor: { sub: string; organizationId: string; role: string },
  ) {
    const leave = await this.findOne(id, actor);

    if (leave.userId !== actor.sub && !this.elevatedRoles.has(actor.role as Role)) {
      throw new ForbiddenException('You can only update your own leave request');
    }

    return this.prisma.leave.update({
      where: { id },
      data: dto,
    });
  }

  async remove(
    id: string,
    actor: { sub: string; organizationId: string; role: string },
  ) {
    const leave = await this.findOne(id, actor);

    if (leave.userId !== actor.sub && !this.elevatedRoles.has(actor.role as Role)) {
      throw new ForbiddenException('You can only delete your own leave request');
    }

    await this.prisma.leave.delete({ where: { id } });
    return { deleted: true, id };
  }

  async approve(
    id: string,
    dto: LeaveApprovalDto,
    actor: { sub: string; organizationId: string; role: string },
  ) {
    const leave = await this.findOne(id, actor);

    if (leave.appliedToId !== actor.sub && !this.elevatedRoles.has(actor.role as Role)) {
      throw new ForbiddenException('You are not allowed to approve this leave request');
    }

    if (leave.status !== LeaveStatus.PENDING) {
      throw new BadRequestException('Only pending leave can be approved');
    }

    const updated = await this.prisma.leave.update({
      where: { id },
      data: {
        status: LeaveStatus.APPROVED,
        approvedById: dto.actorUserId,
        approvedAt: new Date(),
        rejectionReason: null,
      },
    });

    await this.queueService.enqueue({
      type: 'notification.send',
      payload: {
        userId: updated.userId,
        channel: 'email',
        title: 'Leave approved',
        message: `Your leave request has been approved.`,
        locale: 'en',
        metadata: { leaveId: updated.id, status: updated.status },
      },
    });

    return updated;
  }

  async reject(
    id: string,
    dto: LeaveRejectionDto,
    actor: { sub: string; organizationId: string; role: string },
  ) {
    const leave = await this.findOne(id, actor);

    if (leave.appliedToId !== actor.sub && !this.elevatedRoles.has(actor.role as Role)) {
      throw new ForbiddenException('You are not allowed to reject this leave request');
    }

    if (leave.status !== LeaveStatus.PENDING) {
      throw new BadRequestException('Only pending leave can be rejected');
    }

    const updated = await this.prisma.leave.update({
      where: { id },
      data: {
        status: LeaveStatus.REJECTED,
        approvedById: dto.actorUserId,
        approvedAt: new Date(),
        rejectionReason: dto.reason,
      },
    });

    await this.queueService.enqueue({
      type: 'notification.send',
      payload: {
        userId: updated.userId,
        channel: 'email',
        title: 'Leave rejected',
        message: `Your leave request was rejected: ${dto.reason}`,
        locale: 'en',
        metadata: { leaveId: updated.id, status: updated.status },
      },
    });

    return updated;
  }

  async cancel(
    id: string,
    dto: LeaveCancelDto,
    actor: { sub: string; organizationId: string; role: string },
  ) {
    const leave = await this.findOne(id, actor);

    if (leave.status === LeaveStatus.CANCELLED) {
      throw new BadRequestException('Leave is already cancelled');
    }

    if (leave.status === LeaveStatus.REJECTED) {
      throw new BadRequestException('Rejected leave cannot be cancelled');
    }

    if (leave.userId !== actor.sub) {
      throw new BadRequestException('Only leave owner can cancel this leave');
    }

    const updated = await this.prisma.leave.update({
      where: { id },
      data: {
        status: LeaveStatus.CANCELLED,
        rejectionReason: dto.reason ?? leave.rejectionReason,
      },
    });

    await this.queueService.enqueue({
      type: 'notification.send',
      payload: {
        userId: updated.userId,
        channel: 'in-app',
        title: 'Leave cancelled',
        message: 'Your leave request has been cancelled.',
        locale: 'en',
        metadata: { leaveId: updated.id, status: updated.status },
      },
    });

    return updated;
  }

  private computeWorkingDays(startDate: Date, endDate: Date, isHalfDay: boolean) {
    let count = 0;
    const cursor = new Date(startDate);
    cursor.setHours(0, 0, 0, 0);

    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);

    while (cursor.getTime() <= end.getTime()) {
      const day = cursor.getDay();
      if (day !== 0 && day !== 6) {
        count += 1;
      }
      cursor.setDate(cursor.getDate() + 1);
    }

    if (count === 0) {
      return isHalfDay ? 0.5 : 1;
    }

    if (isHalfDay) {
      return Math.max(0.5, count - 0.5);
    }

    return count;
  }

  private async assertUserInOrganization(userId: string, organizationId: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        organizationId,
      },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException('User not found in your organization');
    }
  }

  private async assertUserAccess(
    targetUserId: string,
    actor: { sub: string; organizationId: string; role: string },
  ) {
    await this.assertUserInOrganization(targetUserId, actor.organizationId);

    if (targetUserId !== actor.sub && !this.elevatedRoles.has(actor.role as Role)) {
      throw new ForbiddenException('You can only access your own leave data');
    }
  }

  private defaultUserScope(actor: { sub: string; role: string }) {
    return this.elevatedRoles.has(actor.role as Role) ? undefined : actor.sub;
  }
}
