import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateEmailTemplateDto } from '../dto/create-email-template.dto';
import { EmailTemplateQueryDto } from '../dto/email-template-query.dto';
import { UpdateEmailTemplateDto } from '../dto/update-email-template.dto';

@Injectable()
export class EmailTemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateEmailTemplateDto) {
    return await this.prisma.emailTemplate.create({
      data: {
        organizationId: dto.organizationId,
        key: dto.key,
        name: dto.name,
        subject: dto.subject,
        body: dto.body,
        variables: dto.variables as Prisma.InputJsonValue | undefined,
        isActive: dto.isActive,
      },
    });
  }

  async findAll(query: EmailTemplateQueryDto) {
    return await this.prisma.emailTemplate.findMany({
      where: {
        ...(query.organizationId ? { organizationId: query.organizationId } : {}),
        ...(query.key ? { key: query.key } : {}),
        ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const entity = await this.prisma.emailTemplate.findUnique({ where: { id } });
    if (!entity) throw new NotFoundException('Email template not found');
    return entity;
  }

  async update(id: string, dto: UpdateEmailTemplateDto) {
    await this.findOne(id);

    const data: Prisma.EmailTemplateUpdateInput = {
      ...(dto.name !== undefined ? { name: dto.name } : {}),
      ...(dto.subject !== undefined ? { subject: dto.subject } : {}),
      ...(dto.body !== undefined ? { body: dto.body } : {}),
      ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      ...(dto.variables !== undefined
        ? { variables: dto.variables as Prisma.InputJsonValue }
        : {}),
    };

    return this.prisma.emailTemplate.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.emailTemplate.delete({ where: { id } });
    return { deleted: true, id };
  }
}
