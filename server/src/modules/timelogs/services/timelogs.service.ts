import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateTimelogDto } from '../dto/create-timelog.dto';
import { UpdateTimelogDto } from '../dto/update-timelog.dto';

@Injectable()
export class TimelogsService {
  private readonly elevatedRoles = new Set<Role>([
    Role.SUPER_ADMIN,
    Role.ADMIN,
    Role.HR_MANAGER,
    Role.MANAGER,
  ]);

  constructor(private readonly prisma: PrismaService) {}

  async create(
    dto: CreateTimelogDto,
    actor: { sub: string; organizationId: string; role: string },
  ) {
    await this.assertUserAccess(dto.userId, actor);

    return this.prisma.timeLog.create({
      data: {
        userId: dto.userId,
        clockIn: new Date(dto.clockIn),
        clockOut: dto.clockOut ? new Date(dto.clockOut) : undefined,
        totalHours: dto.totalHours,
        overtimeHours: dto.overtimeHours,
        status: dto.status,
        notes: dto.notes,
      },
    });
  }

  async findAll(
    userId: string | undefined,
    actor: { sub: string; organizationId: string; role: string },
  ) {
    const scopedUserId = userId ?? this.defaultUserScope(actor);

    if (scopedUserId) {
      await this.assertUserAccess(scopedUserId, actor);
    }

    return this.prisma.timeLog.findMany({
      where: scopedUserId
        ? {
            userId: scopedUserId,
            user: { organizationId: actor.organizationId },
          }
        : {
            user: { organizationId: actor.organizationId },
          },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(
    id: string,
    actor: { sub: string; organizationId: string; role: string },
  ) {
    const timelog = await this.prisma.timeLog.findFirst({
      where: {
        id,
        user: { organizationId: actor.organizationId },
      },
    });

    if (!timelog) {
      throw new NotFoundException('Timelog not found');
    }

    if (timelog.userId !== actor.sub && !this.elevatedRoles.has(actor.role as Role)) {
      throw new ForbiddenException('You can only access your own timelogs');
    }

    return timelog;
  }

  async update(
    id: string,
    dto: UpdateTimelogDto,
    actor: { sub: string; organizationId: string; role: string },
  ) {
    await this.findOne(id, actor);

    return this.prisma.timeLog.update({
      where: { id },
      data: {
        clockOut: dto.clockOut ? new Date(dto.clockOut) : undefined,
        totalHours: dto.totalHours,
        overtimeHours: dto.overtimeHours,
        status: dto.status,
        notes: dto.notes,
      },
    });
  }

  async remove(
    id: string,
    actor: { sub: string; organizationId: string; role: string },
  ) {
    await this.findOne(id, actor);

    await this.prisma.timeLog.delete({ where: { id } });
    return { deleted: true, id };
  }

  private async assertUserAccess(
    targetUserId: string,
    actor: { sub: string; organizationId: string; role: string },
  ) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: targetUserId,
        organizationId: actor.organizationId,
      },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException('User not found in your organization');
    }

    if (targetUserId !== actor.sub && !this.elevatedRoles.has(actor.role as Role)) {
      throw new ForbiddenException('You can only access your own timelogs');
    }
  }

  private defaultUserScope(actor: { sub: string; role: string }) {
    return this.elevatedRoles.has(actor.role as Role) ? undefined : actor.sub;
  }
}
