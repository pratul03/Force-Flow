import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { AssignShiftDto } from '../dto/assign-shift.dto';
import { CreateShiftDto } from '../dto/create-shift.dto';
import { UpdateShiftDto } from '../dto/update-shift.dto';

@Injectable()
export class ShiftsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateShiftDto, organizationId: string) {
    if (dto.isDefault) {
      await this.prisma.shift.updateMany({
        where: { organizationId },
        data: { isDefault: false },
      });
    }

    return this.prisma.shift.create({
      data: {
        ...dto,
        organizationId,
      },
    });
  }

  findAll(organizationId: string) {
    return this.prisma.shift.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, organizationId: string) {
    const shift = await this.prisma.shift.findFirst({
      where: {
        id,
        organizationId,
      },
    });
    if (!shift) {
      throw new NotFoundException('Shift not found');
    }
    return shift;
  }

  async update(id: string, dto: UpdateShiftDto, organizationId: string) {
    await this.findOne(id, organizationId);
    
    if (dto.isDefault) {
      await this.prisma.shift.updateMany({
        where: { organizationId, id: { not: id } },
        data: { isDefault: false },
      });
    }

    return this.prisma.shift.update({ where: { id }, data: dto });
  }

  async remove(id: string, organizationId: string) {
    await this.findOne(id, organizationId);
    await this.prisma.shift.delete({ where: { id } });
    return { deleted: true, id };
  }

  async assignToUser(dto: AssignShiftDto, organizationId: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: dto.userId,
        organizationId,
      },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const shift = await this.prisma.shift.findFirst({
      where: {
        id: dto.shiftId,
        organizationId,
      },
    });
    if (!shift) {
      throw new NotFoundException('Shift not found');
    }

    await this.prisma.shiftAssignment.updateMany({
      where: {
        userId: dto.userId,
        isActive: true,
      },
      data: {
        isActive: false,
        effectiveUntil: new Date(dto.effectiveFrom),
      },
    });

    return this.prisma.shiftAssignment.create({
      data: {
        userId: dto.userId,
        shiftId: dto.shiftId,
        effectiveFrom: new Date(dto.effectiveFrom),
        effectiveUntil: dto.effectiveUntil ? new Date(dto.effectiveUntil) : undefined,
      },
      include: {
        shift: true,
      },
    });
  }

  listAssignments(userId: string | undefined, organizationId: string) {
    return this.prisma.shiftAssignment.findMany({
      where: {
        ...(userId ? { userId } : {}),
        shift: {
          organizationId,
        },
      },
      include: { shift: true, user: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
