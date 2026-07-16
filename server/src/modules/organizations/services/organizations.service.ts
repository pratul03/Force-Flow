import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateOrganizationDto } from '../dto/create-organization.dto';
import { UpdateOrganizationDto } from '../dto/update-organization.dto';

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateOrganizationDto) {
    return this.prisma.organization.create({
      data: {
        name: dto.name,
        country: dto.country,
        currency: dto.currency,
        timezone: dto.timezone,
        baseHourlyRate: dto.baseHourlyRate,
        overtimeMultiplier: dto.overtimeMultiplier,
      },
    });
  }

  findAll(organizationId: string) {
    return this.prisma.organization.findMany({
      where: { id: organizationId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, actorOrganizationId: string) {
    if (id !== actorOrganizationId) {
      throw new NotFoundException('Organization not found');
    }

    const organization = await this.prisma.organization.findUnique({
      where: { id: actorOrganizationId },
    });

    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    return organization;
  }

  async update(id: string, dto: UpdateOrganizationDto, actorOrganizationId: string) {
    await this.findOne(id, actorOrganizationId);

    return this.prisma.organization.update({
      where: { id: actorOrganizationId },
      data: dto,
    });
  }

  async remove(id: string, actorOrganizationId: string) {
    await this.findOne(id, actorOrganizationId);

    return this.prisma.organization.delete({
      where: { id: actorOrganizationId },
    });
  }
}
