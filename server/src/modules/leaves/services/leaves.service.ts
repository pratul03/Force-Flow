import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { LeaveStatus } from '@prisma/client';
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
  constructor(
    private readonly prisma: PrismaService,
    private readonly queueService: QueueService,
  ) {}

  create(dto: CreateLeaveDto) {
    return this.apply(dto);
  }

  async apply(dto: CreateLeaveDto) {
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

  findAll(query: LeavesQueryDto) {
    return this.prisma.leave.findMany({
      where: {
        ...(query.userId ? { userId: query.userId } : {}),
        ...(query.approverId ? { appliedToId: query.approverId } : {}),
        ...(query.status ? { status: query.status } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  pending(approverId?: string) {
    return this.prisma.leave.findMany({
      where: {
        status: LeaveStatus.PENDING,
        ...(approverId ? { appliedToId: approverId } : {}),
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string) {
    const leave = await this.prisma.leave.findUnique({ where: { id } });

    if (!leave) {
      throw new NotFoundException('Leave request not found');
    }

    return leave;
  }

  async update(id: string, dto: UpdateLeaveDto) {
    await this.findOne(id);

    return this.prisma.leave.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.leave.delete({ where: { id } });
    return { deleted: true, id };
  }

  async approve(id: string, dto: LeaveApprovalDto) {
    const leave = await this.findOne(id);

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

  async reject(id: string, dto: LeaveRejectionDto) {
    const leave = await this.findOne(id);

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

  async cancel(id: string, dto: LeaveCancelDto) {
    const leave = await this.findOne(id);

    if (leave.status === LeaveStatus.CANCELLED) {
      throw new BadRequestException('Leave is already cancelled');
    }

    if (leave.status === LeaveStatus.REJECTED) {
      throw new BadRequestException('Rejected leave cannot be cancelled');
    }

    if (leave.userId !== dto.actorUserId) {
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
}
