import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateDesignationDto } from '../dto/create-designation.dto';
import { UpdateDesignationDto } from '../dto/update-designation.dto';

@Injectable()
export class DesignationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDesignationDto) {
    return await this.prisma.designation.create({ data: dto });
  }

  async findAll(organizationId?: string) {
    return await this.prisma.designation.findMany({
      where: organizationId ? { organizationId } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const entity = await this.prisma.designation.findUnique({ where: { id } });
    if (!entity) throw new NotFoundException('Designation not found');
    return entity;
  }

  async update(id: string, dto: UpdateDesignationDto) {
    await this.findOne(id);
    return this.prisma.designation.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.designation.delete({ where: { id } });
    return { deleted: true, id };
  }
}
