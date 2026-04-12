import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateTimelogDto } from '../dto/create-timelog.dto';
import { UpdateTimelogDto } from '../dto/update-timelog.dto';

@Injectable()
export class TimelogsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateTimelogDto) {
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

  findAll(userId?: string) {
    return this.prisma.timeLog.findMany({
      where: userId ? { userId } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const timelog = await this.prisma.timeLog.findUnique({ where: { id } });

    if (!timelog) {
      throw new NotFoundException('Timelog not found');
    }

    return timelog;
  }

  async update(id: string, dto: UpdateTimelogDto) {
    await this.findOne(id);

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

  async remove(id: string) {
    await this.findOne(id);

    await this.prisma.timeLog.delete({ where: { id } });
    return { deleted: true, id };
  }
}
