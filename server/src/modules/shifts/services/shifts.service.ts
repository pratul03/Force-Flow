import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { AssignShiftDto } from '../dto/assign-shift.dto';
import { CreateShiftDto } from '../dto/create-shift.dto';
import { UpdateShiftDto } from '../dto/update-shift.dto';

@Injectable()
export class ShiftsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateShiftDto) {
    return this.prisma.shift.create({ data: dto });
  }

  findAll(organizationId?: string) {
    return this.prisma.shift.findMany({
      where: organizationId ? { organizationId } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const shift = await this.prisma.shift.findUnique({ where: { id } });
    if (!shift) {
      throw new NotFoundException('Shift not found');
    }
    return shift;
  }

  async update(id: string, dto: UpdateShiftDto) {
    await this.findOne(id);
    return this.prisma.shift.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.shift.delete({ where: { id } });
    return { deleted: true, id };
  }

  async assignToUser(dto: AssignShiftDto) {
    const user = await this.prisma.user.findUnique({ where: { id: dto.userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const shift = await this.prisma.shift.findUnique({ where: { id: dto.shiftId } });
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

  listAssignments(userId?: string) {
    return this.prisma.shiftAssignment.findMany({
      where: userId ? { userId } : undefined,
      include: { shift: true, user: true },
      orderBy: { createdAt: 'desc' },
    });
  }
}
