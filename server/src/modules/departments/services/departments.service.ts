import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateDepartmentDto } from '../dto/create-department.dto';
import { UpdateDepartmentDto } from '../dto/update-department.dto';

@Injectable()
export class DepartmentsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateDepartmentDto, organizationId: string) {
    return this.prisma.department.create({
      data: {
        ...dto,
        organizationId,
      },
    });
  }

  findAll(organizationId: string) {
    return this.prisma.department.findMany({
      where: { organizationId },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
          }
        },
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, organizationId: string) {
    const entity = await this.prisma.department.findFirst({
      where: { id, organizationId },
      include: {
        parent: {
          select: {
            id: true,
            name: true,
          }
        },
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        children: {
          select: {
            id: true,
            name: true,
          }
        },
      },
    });
    if (!entity) throw new NotFoundException('Department not found');
    return entity;
  }

  async update(id: string, dto: UpdateDepartmentDto, organizationId: string) {
    await this.findOne(id, organizationId);
    return this.prisma.department.update({ where: { id }, data: dto });
  }

  async remove(id: string, organizationId: string) {
    await this.findOne(id, organizationId);
    await this.prisma.department.delete({ where: { id } });
    return { deleted: true, id };
  }
}
