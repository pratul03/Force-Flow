import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateLocationDto } from '../dto/create-location.dto';
import { UpdateLocationDto } from '../dto/update-location.dto';

@Injectable()
export class LocationsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateLocationDto, organizationId: string) {
    return this.prisma.location.create({
      data: {
        ...dto,
        organizationId,
      },
    });
  }

  findAll(organizationId: string) {
    return this.prisma.location.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, organizationId: string) {
    const entity = await this.prisma.location.findFirst({
      where: { id, organizationId },
    });
    if (!entity) throw new NotFoundException('Location not found');
    return entity;
  }

  async update(id: string, dto: UpdateLocationDto, organizationId: string) {
    await this.findOne(id, organizationId);
    return this.prisma.location.update({ where: { id }, data: dto });
  }

  async remove(id: string, organizationId: string) {
    await this.findOne(id, organizationId);
    await this.prisma.location.delete({ where: { id } });
    return { deleted: true, id };
  }
}
