import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { LeadStatus, Role } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateLeadDto } from '../dto/create-lead.dto';
import { LeadsQueryDto } from '../dto/leads-query.dto';
import { UpdateLeadDto } from '../dto/update-lead.dto';

@Injectable()
export class LeadsService {
  private readonly allowedRoles = new Set<Role>([
    Role.SUPER_ADMIN,
    Role.ADMIN,
    Role.HR_MANAGER,
    Role.MANAGER,
  ]);

  constructor(private readonly prisma: PrismaService) {}

  findAll(query: LeadsQueryDto) {
    const search = query.search?.trim();

    return this.prisma.lead.findMany({
      where: {
        ...(query.organizationId ? { organizationId: query.organizationId } : {}),
        ...(query.status ? { status: query.status } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search, mode: 'insensitive' } },
                { company: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: query.limit ?? 200,
      include: {
        quotations: {
          select: {
            id: true,
            status: true,
            quoteNumber: true,
            totalAmount: true,
            currency: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async findOne(id: string, organizationId?: string) {
    const lead = await this.prisma.lead.findFirst({
      where: {
        id,
        ...(organizationId ? { organizationId } : {}),
      },
      include: {
        quotations: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    return lead;
  }

  async create(dto: CreateLeadDto) {
    const actor = await this.getActorOrThrow(dto.actorUserId);
    this.assertActorPermission(actor.organizationId, dto.organizationId, actor.role);

    return this.prisma.lead.create({
      data: {
        organizationId: dto.organizationId,
        createdById: actor.id,
        name: dto.name,
        company: dto.company,
        email: dto.email.toLowerCase(),
        phone: dto.phone,
        source: dto.source,
        notes: dto.notes,
        status: dto.status ?? LeadStatus.NEW,
        expectedAmount: dto.expectedAmount,
        currency: dto.currency,
      },
    });
  }

  async update(id: string, dto: UpdateLeadDto) {
    const [lead, actor] = await Promise.all([
      this.findOne(id),
      this.getActorOrThrow(dto.actorUserId),
    ]);

    this.assertActorPermission(actor.organizationId, lead.organizationId, actor.role);

    return this.prisma.lead.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name } : {}),
        ...(dto.company !== undefined ? { company: dto.company } : {}),
        ...(dto.email !== undefined ? { email: dto.email.toLowerCase() } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
        ...(dto.source !== undefined ? { source: dto.source } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.expectedAmount !== undefined ? { expectedAmount: dto.expectedAmount } : {}),
        ...(dto.currency !== undefined ? { currency: dto.currency } : {}),
      },
    });
  }

  async remove(id: string, actorUserId: string) {
    const [lead, actor] = await Promise.all([
      this.findOne(id),
      this.getActorOrThrow(actorUserId),
    ]);

    this.assertActorPermission(actor.organizationId, lead.organizationId, actor.role);

    if (lead.quotations.length > 0) {
      throw new BadRequestException('Cannot delete lead with existing quotations');
    }

    await this.prisma.lead.delete({ where: { id } });
    return { deleted: true, id };
  }

  private async getActorOrThrow(actorUserId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: actorUserId },
      select: {
        id: true,
        organizationId: true,
        role: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Actor user not found');
    }

    return user;
  }

  private assertActorPermission(
    actorOrganizationId: string,
    organizationId: string,
    role: Role,
  ) {
    if (actorOrganizationId !== organizationId) {
      throw new BadRequestException('User must belong to the same organization');
    }

    if (!this.allowedRoles.has(role)) {
      throw new ForbiddenException('Insufficient role permission for leads operation');
    }
  }
}
