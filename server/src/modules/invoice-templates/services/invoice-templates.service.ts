import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreateInvoiceTemplateDto } from '../dto/create-invoice-template.dto';
import { InvoiceTemplateQueryDto } from '../dto/invoice-template-query.dto';
import { UpdateInvoiceTemplateDto } from '../dto/update-invoice-template.dto';

@Injectable()
export class InvoiceTemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateInvoiceTemplateDto, organizationId: string) {
    if (dto.isDefault) {
      return this.prisma.$transaction(async (tx) => {
        await tx.invoiceTemplate.updateMany({
          where: {
            organizationId,
            isDefault: true,
          },
          data: { isDefault: false },
        });

        return tx.invoiceTemplate.create({
          data: {
            organizationId,
            key: dto.key,
            name: dto.name,
            headerHtml: dto.headerHtml,
            bodyHtml: dto.bodyHtml,
            footerHtml: dto.footerHtml,
            css: dto.css,
            variables: dto.variables as Prisma.InputJsonValue | undefined,
            isDefault: dto.isDefault,
            isActive: dto.isActive,
          },
        });
      });
    }

    return this.prisma.invoiceTemplate.create({
      data: {
        organizationId,
        key: dto.key,
        name: dto.name,
        headerHtml: dto.headerHtml,
        bodyHtml: dto.bodyHtml,
        footerHtml: dto.footerHtml,
        css: dto.css,
        variables: dto.variables as Prisma.InputJsonValue | undefined,
        isDefault: dto.isDefault,
        isActive: dto.isActive,
      },
    });
  }

  async findAll(query: InvoiceTemplateQueryDto, organizationId: string) {
    return this.prisma.invoiceTemplate.findMany({
      where: {
        organizationId,
        ...(query.key ? { key: query.key } : {}),
        ...(query.isDefault !== undefined ? { isDefault: query.isDefault } : {}),
        ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
      },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async findOne(id: string, organizationId: string) {
    const entity = await this.prisma.invoiceTemplate.findFirst({
      where: {
        id,
        organizationId,
      },
    });
    if (!entity) throw new NotFoundException('Invoice template not found');
    return entity;
  }

  async update(id: string, dto: UpdateInvoiceTemplateDto, organizationId: string) {
    const existing = await this.findOne(id, organizationId);

    const data: Prisma.InvoiceTemplateUpdateInput = {
      ...(dto.name !== undefined ? { name: dto.name } : {}),
      ...(dto.headerHtml !== undefined ? { headerHtml: dto.headerHtml } : {}),
      ...(dto.bodyHtml !== undefined ? { bodyHtml: dto.bodyHtml } : {}),
      ...(dto.footerHtml !== undefined ? { footerHtml: dto.footerHtml } : {}),
      ...(dto.css !== undefined ? { css: dto.css } : {}),
      ...(dto.isDefault !== undefined ? { isDefault: dto.isDefault } : {}),
      ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
      ...(dto.variables !== undefined
        ? { variables: dto.variables as Prisma.InputJsonValue }
        : {}),
    };

    if (dto.isDefault) {
      return this.prisma.$transaction(async (tx) => {
        await tx.invoiceTemplate.updateMany({
          where: {
            organizationId: existing.organizationId,
            isDefault: true,
            id: { not: id },
          },
          data: { isDefault: false },
        });

        return tx.invoiceTemplate.update({
          where: { id },
          data,
        });
      });
    }

    return this.prisma.invoiceTemplate.update({
      where: { id },
      data,
    });
  }

  async remove(id: string, organizationId: string) {
    await this.findOne(id, organizationId);
    await this.prisma.invoiceTemplate.delete({ where: { id } });
    return { deleted: true, id };
  }
}
