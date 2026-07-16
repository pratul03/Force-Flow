import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  LeadStatus,
  Prisma,
  QuotationStatus,
  Role,
} from '@prisma/client';
import { randomBytes } from 'crypto';
import puppeteer from 'puppeteer';
import { PrismaService } from '../../../prisma/prisma.service';
import { QueueService } from '../../queue/services/queue.service';
import { CreateQuotationDto } from '../dto/create-quotation.dto';
import { ManualQuotationActionDto } from '../dto/manual-quotation-action.dto';
import { PublicQuotationResponseDto } from '../dto/public-quotation-response.dto';
import { QuotationsQueryDto } from '../dto/quotations-query.dto';
import { SendQuotationDto } from '../dto/send-quotation.dto';
import { UpdateQuotationDto } from '../dto/update-quotation.dto';

type QuotationLineItemRecord = {
  title: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  taxPercent: number;
  discountPercent: number;
  lineBase: number;
  lineTotal: number;
};

type QuotationDesignerRecord = {
  companyDisplayName?: string;
  logoUrl?: string;
  primaryColor?: string;
  accentColor?: string;
  headerHtml?: string;
  footerHtml?: string;
};

@Injectable()
export class QuotationsService {
  private readonly allowedRoles = new Set<Role>([
    Role.SUPER_ADMIN,
    Role.ADMIN,
    Role.HR_MANAGER,
    Role.MANAGER,
  ]);

  private readonly finalizedStatuses = new Set<QuotationStatus>([
    QuotationStatus.APPROVED,
    QuotationStatus.REJECTED,
    QuotationStatus.CANCELLED,
  ]);

  private readonly deletableStatuses = new Set<QuotationStatus>([
    QuotationStatus.DRAFT,
    QuotationStatus.CANCELLED,
  ]);

  constructor(
    private readonly prisma: PrismaService,
    private readonly queueService: QueueService,
  ) {}

  findAll(query: QuotationsQueryDto) {
    return this.prisma.quotation.findMany({
      where: {
        ...(query.organizationId ? { organizationId: query.organizationId } : {}),
        ...(query.leadId ? { leadId: query.leadId } : {}),
        ...(query.status ? { status: query.status } : {}),
      },
      include: {
        lead: true,
      },
      orderBy: { createdAt: 'desc' },
      take: query.limit ?? 200,
    });
  }

  async findOne(id: string, organizationId?: string) {
    const quotation = await this.prisma.quotation.findFirst({
      where: {
        id,
        ...(organizationId ? { organizationId } : {}),
      },
      include: {
        lead: true,
        events: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!quotation) {
      throw new NotFoundException('Quotation not found');
    }

    return quotation;
  }

  async create(dto: CreateQuotationDto) {
    const [actor, lead] = await Promise.all([
      this.getActorOrThrow(dto.actorUserId),
      this.prisma.lead.findUnique({
        where: { id: dto.leadId },
      }),
    ]);

    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    this.assertActorPermission(actor.organizationId, dto.organizationId, actor.role);

    if (lead.organizationId !== dto.organizationId) {
      throw new BadRequestException('Lead and quotation organization must match');
    }

    const lineItems = this.normalizeLineItems(dto.lineItems);
    const designer = this.normalizeDesigner(dto.designer);

    const baseAmountFromItems = this.sumLineItemsBase(lineItems);
    const baseAmount = lineItems.length > 0 ? baseAmountFromItems : (dto.amount ?? 0);

    if (baseAmount <= 0) {
      throw new BadRequestException('amount or lineItems must produce a value greater than zero');
    }

    const taxPercent = dto.taxPercent ?? 0;
    const discountPercent = dto.discountPercent ?? 0;
    const itemAdjustedAmount =
      lineItems.length > 0 ? this.sumLineItemsTotal(lineItems) : baseAmount;
    const totalAmount = this.calculateTotal(itemAdjustedAmount, taxPercent, discountPercent);

    const quoteNumber = await this.generateQuoteNumber();
    const publicToken = randomBytes(24).toString('hex');

    const created = await this.prisma.$transaction(async (tx) => {
      const quotation = await tx.quotation.create({
        data: {
          organizationId: dto.organizationId,
          leadId: dto.leadId,
          quoteNumber,
          publicToken,
          title: dto.title,
          description: dto.description,
          amount: baseAmount,
          currency: dto.currency,
          taxPercent,
          discountPercent,
          totalAmount,
          ...(lineItems.length > 0
            ? { lineItems: lineItems as Prisma.InputJsonValue }
            : {}),
          ...(designer ? { designer: designer as Prisma.InputJsonValue } : {}),
          validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
          createdById: actor.id,
          updatedById: actor.id,
          status: QuotationStatus.DRAFT,
        },
      });

      if (lead.status !== LeadStatus.QUOTED) {
        await tx.lead.update({
          where: { id: lead.id },
          data: { status: LeadStatus.QUOTED },
        });
      }

      await tx.quotationStatusEvent.create({
        data: {
          quotationId: quotation.id,
          actorUserId: actor.id,
          fromStatus: null,
          toStatus: QuotationStatus.DRAFT,
          note: 'Quotation created',
        },
      });

      return quotation;
    });

    return this.findOne(created.id, actor.organizationId);
  }

  async update(id: string, dto: UpdateQuotationDto) {
    const actor = await this.getActorOrThrow(dto.actorUserId);
    const quotation = await this.findOne(id, actor.organizationId);

    this.assertActorPermission(
      actor.organizationId,
      quotation.organizationId,
      actor.role,
    );

    if (this.finalizedStatuses.has(quotation.status)) {
      throw new BadRequestException('Finalized quotation cannot be edited');
    }

    const lineItems =
      dto.lineItems !== undefined
        ? this.normalizeLineItems(dto.lineItems)
        : this.readLineItems(quotation.lineItems);

    const amount =
      lineItems.length > 0
        ? this.sumLineItemsBase(lineItems)
        : (dto.amount ?? quotation.amount);

    if (amount <= 0) {
      throw new BadRequestException('amount or lineItems must produce a value greater than zero');
    }

    const taxPercent = dto.taxPercent ?? quotation.taxPercent;
    const discountPercent = dto.discountPercent ?? quotation.discountPercent;
    const itemAdjustedAmount =
      lineItems.length > 0 ? this.sumLineItemsTotal(lineItems) : amount;
    const totalAmount = this.calculateTotal(itemAdjustedAmount, taxPercent, discountPercent);

    const nextDesigner =
      dto.designer !== undefined
        ? this.normalizeDesigner(dto.designer)
        : this.readDesigner(quotation.designer);

    const updated = await this.prisma.quotation.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.amount !== undefined || dto.lineItems !== undefined
          ? { amount }
          : {}),
        ...(dto.currency !== undefined ? { currency: dto.currency } : {}),
        ...(dto.taxPercent !== undefined ? { taxPercent: dto.taxPercent } : {}),
        ...(dto.discountPercent !== undefined
          ? { discountPercent: dto.discountPercent }
          : {}),
        ...(dto.lineItems !== undefined
          ? { lineItems: lineItems as Prisma.InputJsonValue }
          : {}),
        ...(dto.designer !== undefined
          ? {
              designer: nextDesigner
                ? (nextDesigner as Prisma.InputJsonValue)
                : Prisma.JsonNull,
            }
          : {}),
        totalAmount,
        ...(dto.validUntil !== undefined
          ? { validUntil: dto.validUntil ? new Date(dto.validUntil) : null }
          : {}),
        updatedById: actor.id,
      },
    });

    return this.findOne(updated.id, actor.organizationId);
  }

  async remove(id: string, actorUserId: string) {
    const actor = await this.getActorOrThrow(actorUserId);
    const quotation = await this.findOne(id, actor.organizationId);

    this.assertActorPermission(
      actor.organizationId,
      quotation.organizationId,
      actor.role,
    );

    if (!this.deletableStatuses.has(quotation.status)) {
      throw new BadRequestException('Only draft/cancelled quotations can be deleted');
    }

    await this.prisma.quotation.delete({ where: { id } });
    return { deleted: true, id };
  }

  async send(id: string, dto: SendQuotationDto) {
    const actor = await this.getActorOrThrow(dto.actorUserId);
    const quotation = await this.findOne(id, actor.organizationId);

    this.assertActorPermission(
      actor.organizationId,
      quotation.organizationId,
      actor.role,
    );

    if (this.finalizedStatuses.has(quotation.status)) {
      throw new BadRequestException('Cannot send a finalized/cancelled quotation');
    }

    if (quotation.validUntil && quotation.validUntil.getTime() < Date.now()) {
      throw new BadRequestException('Cannot send an expired quotation');
    }

    const publicUrl = this.getPublicQuotationUrl(quotation.publicToken);
    const pdfBuffer = await this.generateQuotationPdf(quotation, quotation.lead, publicUrl);

    await this.prisma.$transaction([
      this.prisma.quotation.update({
        where: { id },
        data: {
          status: QuotationStatus.SENT,
          sentAt: new Date(),
          updatedById: actor.id,
        },
      }),
      this.prisma.quotationStatusEvent.create({
        data: {
          quotationId: id,
          actorUserId: actor.id,
          fromStatus: quotation.status,
          toStatus: QuotationStatus.SENT,
          note: 'Quotation sent to client',
        },
      }),
    ]);

    await this.queueService.enqueue({
      type: 'notification.send',
      payload: {
        userId: actor.id,
        channel: 'email',
        title: `Quotation ${quotation.quoteNumber} sent to ${quotation.lead.email}`,
        message:
          dto.emailMessage ||
          `Quotation ${quotation.quoteNumber} has been prepared for ${quotation.lead.name}. Public response link: ${publicUrl}`,
        locale: 'en',
        metadata: {
          toEmail: quotation.lead.email,
          clientName: quotation.lead.name,
          quotationId: quotation.id,
          quoteNumber: quotation.quoteNumber,
          publicUrl,
          attachment: {
            fileName: `${quotation.quoteNumber}.pdf`,
            mimeType: 'application/pdf',
            contentBase64: pdfBuffer.toString('base64'),
          },
        },
      },
      maxAttempts: 5,
    });

    return {
      quotation: await this.findOne(id, actor.organizationId),
      publicUrl,
    };
  }

  async manualApprove(id: string, dto: ManualQuotationActionDto) {
    return this.transitionFromAdmin(id, dto, QuotationStatus.APPROVED);
  }

  async manualReject(id: string, dto: ManualQuotationActionDto) {
    return this.transitionFromAdmin(id, dto, QuotationStatus.REJECTED);
  }

  async publicDetails(token: string) {
    const quotation = await this.findByPublicTokenOrThrow(token);
    await this.expireIfNeeded(quotation);
    return this.findByPublicTokenOrThrow(token);
  }

  async publicApprove(token: string, dto: PublicQuotationResponseDto) {
    return this.transitionFromPublic(token, dto, QuotationStatus.APPROVED);
  }

  async publicReject(token: string, dto: PublicQuotationResponseDto) {
    return this.transitionFromPublic(token, dto, QuotationStatus.REJECTED);
  }

  async downloadPdfForAdmin(id: string, actorUserId: string) {
    const actor = await this.getActorOrThrow(actorUserId);
    const quotation = await this.findOne(id, actor.organizationId);

    this.assertActorPermission(
      actor.organizationId,
      quotation.organizationId,
      actor.role,
    );

    const publicUrl = this.getPublicQuotationUrl(quotation.publicToken);
    const buffer = await this.generateQuotationPdf(quotation, quotation.lead, publicUrl);

    return {
      fileName: `${quotation.quoteNumber}.pdf`,
      buffer,
    };
  }

  async downloadPdfForPublicToken(token: string) {
    const quotation = await this.findByPublicTokenOrThrow(token);
    const publicUrl = this.getPublicQuotationUrl(quotation.publicToken);
    const buffer = await this.generateQuotationPdf(quotation, quotation.lead, publicUrl);

    return {
      fileName: `${quotation.quoteNumber}.pdf`,
      buffer,
    };
  }

  private async transitionFromAdmin(
    id: string,
    dto: ManualQuotationActionDto,
    nextStatus: 'APPROVED' | 'REJECTED',
  ) {
    const actor = await this.getActorOrThrow(dto.actorUserId);
    const quotation = await this.findOne(id, actor.organizationId);

    this.assertActorPermission(
      actor.organizationId,
      quotation.organizationId,
      actor.role,
    );

    if (quotation.status !== QuotationStatus.SENT) {
      throw new BadRequestException('Only sent quotations can be manually approved/rejected');
    }

    await this.prisma.$transaction([
      this.prisma.quotation.update({
        where: { id },
        data: {
          status: nextStatus,
          respondedAt: new Date(),
          approvedAt: nextStatus === QuotationStatus.APPROVED ? new Date() : null,
          rejectedAt: nextStatus === QuotationStatus.REJECTED ? new Date() : null,
          approvalNote: nextStatus === QuotationStatus.APPROVED ? dto.note ?? null : null,
          rejectionNote: nextStatus === QuotationStatus.REJECTED ? dto.note ?? null : null,
          updatedById: actor.id,
        },
      }),
      this.prisma.quotationStatusEvent.create({
        data: {
          quotationId: id,
          actorUserId: actor.id,
          fromStatus: quotation.status,
          toStatus: nextStatus,
          note: dto.note ?? 'Manual decision from admin UI',
        },
      }),
    ]);

    return this.findOne(id, actor.organizationId);
  }

  private async transitionFromPublic(
    token: string,
    dto: PublicQuotationResponseDto,
    nextStatus: 'APPROVED' | 'REJECTED',
  ) {
    const quotation = await this.findByPublicTokenOrThrow(token);

    await this.expireIfNeeded(quotation);

    if (quotation.status !== QuotationStatus.SENT) {
      throw new BadRequestException('Quotation is not awaiting client response');
    }

    const actorLabel = dto.clientName?.trim() || quotation.lead.name || quotation.lead.email;

    await this.prisma.$transaction([
      this.prisma.quotation.update({
        where: { id: quotation.id },
        data: {
          status: nextStatus,
          respondedAt: new Date(),
          approvedAt: nextStatus === QuotationStatus.APPROVED ? new Date() : null,
          rejectedAt: nextStatus === QuotationStatus.REJECTED ? new Date() : null,
          approvalNote: nextStatus === QuotationStatus.APPROVED ? dto.note ?? null : null,
          rejectionNote: nextStatus === QuotationStatus.REJECTED ? dto.note ?? null : null,
        },
      }),
      this.prisma.quotationStatusEvent.create({
        data: {
          quotationId: quotation.id,
          actorUserId: null,
          actorLabel,
          fromStatus: quotation.status,
          toStatus: nextStatus,
          note: dto.note ?? 'Client response from public page',
        },
      }),
    ]);

    await this.queueService.enqueue({
      type: 'notification.send',
      payload: {
        userId: quotation.createdById,
        channel: 'in-app',
        title: `Client ${nextStatus === QuotationStatus.APPROVED ? 'approved' : 'rejected'} quotation`,
        message: `Client response received for ${quotation.quoteNumber}.`,
        locale: 'en',
        metadata: {
          quotationId: quotation.id,
          status: nextStatus,
          clientName: actorLabel,
        },
      },
      maxAttempts: 3,
    });

    return this.findByPublicTokenOrThrow(token);
  }

  private async expireIfNeeded(
    quotation: Prisma.QuotationGetPayload<{ include: { lead: true } }>,
  ) {
    if (
      quotation.status === QuotationStatus.SENT &&
      quotation.validUntil &&
      quotation.validUntil.getTime() < Date.now()
    ) {
      await this.prisma.$transaction([
        this.prisma.quotation.update({
          where: { id: quotation.id },
          data: {
            status: QuotationStatus.EXPIRED,
            updatedById: quotation.updatedById,
          },
        }),
        this.prisma.quotationStatusEvent.create({
          data: {
            quotationId: quotation.id,
            fromStatus: QuotationStatus.SENT,
            toStatus: QuotationStatus.EXPIRED,
            note: 'Quotation expired after valid until date',
          },
        }),
      ]);
    }
  }

  private async findByPublicTokenOrThrow(token: string) {
    const quotation = await this.prisma.quotation.findUnique({
      where: { publicToken: token },
      include: {
        lead: true,
        events: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!quotation) {
      throw new NotFoundException('Quotation not found');
    }

    return quotation;
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
      throw new ForbiddenException('Insufficient role permission for quotation operation');
    }
  }

  private calculateTotal(amount: number, taxPercent: number, discountPercent: number) {
    const safeAmount = Math.max(0, amount);
    const safeTax = Math.min(100, Math.max(0, taxPercent));
    const safeDiscount = Math.min(100, Math.max(0, discountPercent));

    const taxed = safeAmount + (safeAmount * safeTax) / 100;
    const discounted = taxed - (safeAmount * safeDiscount) / 100;

    return Number(discounted.toFixed(2));
  }

  private async generateQuoteNumber() {
    for (let i = 0; i < 5; i += 1) {
      const now = new Date();
      const y = now.getUTCFullYear();
      const m = String(now.getUTCMonth() + 1).padStart(2, '0');
      const suffix = randomBytes(3).toString('hex').toUpperCase();
      const candidate = `Q-${y}${m}-${suffix}`;

      const existing = await this.prisma.quotation.findUnique({
        where: { quoteNumber: candidate },
        select: { id: true },
      });

      if (!existing) {
        return candidate;
      }
    }

    throw new BadRequestException('Failed to generate unique quote number');
  }

  private getPublicQuotationUrl(publicToken: string) {
    const appUrl = process.env.PUBLIC_APP_URL ?? 'http://localhost:3000';
    return `${appUrl.replace(/\/$/, '')}/quote/respond/${publicToken}`;
  }

  private generateQuotationPdf(
    quotation: Prisma.QuotationGetPayload<{ include: { lead: true } }>,
    lead: Prisma.QuotationGetPayload<{ include: { lead: true } }>['lead'],
    publicUrl: string,
  ) {
    return this.renderQuotationPdfWithPuppeteer(quotation, lead, publicUrl);
  }

  private async renderQuotationPdfWithPuppeteer(
    quotation: Prisma.QuotationGetPayload<{ include: { lead: true } }>,
    lead: Prisma.QuotationGetPayload<{ include: { lead: true } }>['lead'],
    publicUrl: string,
  ) {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      const html = this.renderQuotationHtml(quotation, lead, publicUrl);

      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '24mm',
          right: '16mm',
          bottom: '24mm',
          left: '16mm',
        },
      });

      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  }

  private renderQuotationHtml(
    quotation: Prisma.QuotationGetPayload<{ include: { lead: true } }>,
    lead: Prisma.QuotationGetPayload<{ include: { lead: true } }>['lead'],
    publicUrl: string,
  ) {
    const safe = (value: string | null | undefined) =>
      this.escapeHtml(value ?? '-');

    const lineItems = this.readLineItems(quotation.lineItems);
    const designer = this.readDesigner(quotation.designer);
    const primaryColor = this.safeColor(designer.primaryColor, '#1d4ed8');
    const accentColor = this.safeColor(designer.accentColor, '#eff6ff');
    const companyDisplayName = designer.companyDisplayName?.trim() || 'FlowForce HRM';

    const validUntil = quotation.validUntil
      ? quotation.validUntil.toISOString().slice(0, 10)
      : '-';

    const logoBlock = designer.logoUrl?.trim()
      ? `<img src="${safe(designer.logoUrl)}" alt="logo" style="height:56px; max-width:220px; object-fit:contain;" />`
      : '';

    const headerHtml = designer.headerHtml?.trim()
      ? `<div class="custom-block">${this.sanitizeTemplateHtml(designer.headerHtml)}</div>`
      : '';

    const footerHtml = designer.footerHtml?.trim()
      ? `<div class="custom-block">${this.sanitizeTemplateHtml(designer.footerHtml)}</div>`
      : '';

    const lineItemsTable =
      lineItems.length === 0
        ? `<div class="card">
            <h3>Description</h3>
            <p>${safe(quotation.description).replace(/\n/g, '<br/>')}</p>
            <div class="row"><span>Base Amount</span><strong>${quotation.amount.toFixed(2)} ${safe(
              quotation.currency,
            )}</strong></div>
          </div>`
        : `<div class="card">
            <h3>Line Items</h3>
            <table class="items-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Unit</th>
                  <th>Tax%</th>
                  <th>Disc%</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${lineItems
                  .map(
                    (item) => `<tr>
                      <td>
                        <div class="item-title">${safe(item.title)}</div>
                        <div class="item-desc">${safe(item.description || '')}</div>
                      </td>
                      <td>${item.quantity.toFixed(2)}</td>
                      <td>${item.unitPrice.toFixed(2)}</td>
                      <td>${item.taxPercent.toFixed(2)}</td>
                      <td>${item.discountPercent.toFixed(2)}</td>
                      <td>${item.lineTotal.toFixed(2)}</td>
                    </tr>`,
                  )
                  .join('')}
              </tbody>
            </table>
          </div>`;

    return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Quotation ${safe(quotation.quoteNumber)}</title>
    <style>
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        color: #0f172a;
        background: #ffffff;
      }
      .container {
        padding: 20px;
      }
      .hero {
        border: 1px solid ${primaryColor}55;
        border-radius: 14px;
        background: linear-gradient(135deg, ${accentColor}, #f8fafc);
        padding: 18px;
        margin-bottom: 16px;
      }
      .hero h1 {
        margin: 0;
        font-size: 26px;
      }
      .hero-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
        margin-bottom: 8px;
      }
      .muted {
        color: #475569;
        font-size: 12px;
      }
      .grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        margin: 14px 0;
      }
      .card {
        border: 1px solid #e2e8f0;
        border-radius: 12px;
        padding: 12px;
        background: #ffffff;
      }
      .card h3 {
        margin: 0 0 8px;
        font-size: 13px;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: #334155;
      }
      .row {
        display: flex;
        justify-content: space-between;
        gap: 10px;
        font-size: 13px;
        margin-bottom: 6px;
      }
      .row strong { color: #0f172a; }
      .items-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 12px;
      }
      .items-table th,
      .items-table td {
        border-bottom: 1px solid #e2e8f0;
        padding: 8px 6px;
        text-align: left;
        vertical-align: top;
      }
      .items-table th {
        color: #334155;
        font-weight: 700;
      }
      .item-title { font-weight: 600; }
      .item-desc { color: #64748b; margin-top: 2px; }
      .total {
        margin-top: 8px;
        padding-top: 8px;
        border-top: 1px dashed #94a3b8;
        font-size: 16px;
        font-weight: 700;
      }
      .cta {
        margin-top: 14px;
        border: 1px solid #cbd5e1;
        border-radius: 12px;
        padding: 12px;
        background: #f8fafc;
      }
      a {
        color: ${primaryColor};
        word-break: break-all;
      }
      .custom-block {
        border: 1px dashed #cbd5e1;
        border-radius: 10px;
        background: #f8fafc;
        padding: 10px;
        margin-bottom: 12px;
        font-size: 12px;
      }
      .footer {
        margin-top: 18px;
        color: #64748b;
        font-size: 11px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="hero">
        <div class="hero-top">
          <h1>${safe(companyDisplayName)}</h1>
          ${logoBlock}
        </div>
        <h1>Quotation ${safe(quotation.quoteNumber)}</h1>
        <p class="muted">Status: ${safe(quotation.status)} | Created: ${safe(
          quotation.createdAt.toISOString(),
        )}</p>
      </div>

      ${headerHtml}

      <div class="grid">
        <div class="card">
          <h3>Client</h3>
          <div class="row"><span>Name</span><strong>${safe(lead.name)}</strong></div>
          <div class="row"><span>Company</span><strong>${safe(lead.company)}</strong></div>
          <div class="row"><span>Email</span><strong>${safe(lead.email)}</strong></div>
          <div class="row"><span>Phone</span><strong>${safe(lead.phone)}</strong></div>
        </div>
        <div class="card">
          <h3>Summary</h3>
          <div class="row"><span>Title</span><strong>${safe(quotation.title)}</strong></div>
          <div class="row"><span>Valid Until</span><strong>${safe(validUntil)}</strong></div>
          <div class="row"><span>Currency</span><strong>${safe(quotation.currency)}</strong></div>
          <div class="row"><span>Tax</span><strong>${quotation.taxPercent.toFixed(2)}%</strong></div>
          <div class="row"><span>Discount</span><strong>${quotation.discountPercent.toFixed(2)}%</strong></div>
        </div>
      </div>

      ${lineItemsTable}

      <div class="card">
        <h3>Totals</h3>
        <div class="row"><span>Base Amount</span><strong>${quotation.amount.toFixed(2)} ${safe(
          quotation.currency,
        )}</strong></div>
        <div class="row"><span>Global Tax</span><strong>${quotation.taxPercent.toFixed(2)}%</strong></div>
        <div class="row"><span>Global Discount</span><strong>${quotation.discountPercent.toFixed(
          2,
        )}%</strong></div>
        <div class="row total"><span>Total Amount</span><strong>${quotation.totalAmount.toFixed(
          2,
        )} ${safe(quotation.currency)}</strong></div>
      </div>

      <div class="cta">
        <strong>Client Approval Link:</strong>
        <div><a href="${safe(publicUrl)}">${safe(publicUrl)}</a></div>
      </div>

      ${footerHtml}

      <div class="footer">Generated by FlowForce HRM quotation service.</div>
    </div>
  </body>
</html>`;
  }

  private normalizeLineItems(input?: unknown[]) {
    if (!input || input.length === 0) {
      return [] as QuotationLineItemRecord[];
    }

    return input
      .map((rawItem) => {
        if (!rawItem || typeof rawItem !== 'object') {
          return null;
        }

        const item = rawItem as Record<string, unknown>;
        const title = String(item.title ?? '').trim();
        const description = String(item.description ?? '').trim();
        const quantity = Number(item.quantity ?? 0);
        const unitPrice = Number(item.unitPrice ?? 0);
        const taxPercent = Number(item.taxPercent ?? 0);
        const discountPercent = Number(item.discountPercent ?? 0);

        if (!title || !Number.isFinite(quantity) || quantity <= 0) {
          return null;
        }

        const safeUnitPrice = Number.isFinite(unitPrice) ? Math.max(0, unitPrice) : 0;
        const safeTax = Number.isFinite(taxPercent)
          ? Math.min(100, Math.max(0, taxPercent))
          : 0;
        const safeDiscount = Number.isFinite(discountPercent)
          ? Math.min(100, Math.max(0, discountPercent))
          : 0;

        const lineBase = Number((quantity * safeUnitPrice).toFixed(2));
        const taxed = lineBase + (lineBase * safeTax) / 100;
        const lineTotal = Number((taxed - (lineBase * safeDiscount) / 100).toFixed(2));

        return {
          title,
          description: description || undefined,
          quantity: Number(quantity.toFixed(2)),
          unitPrice: Number(safeUnitPrice.toFixed(2)),
          taxPercent: Number(safeTax.toFixed(2)),
          discountPercent: Number(safeDiscount.toFixed(2)),
          lineBase,
          lineTotal,
        } as QuotationLineItemRecord;
      })
      .filter((item): item is QuotationLineItemRecord => !!item);
  }

  private readLineItems(jsonValue: Prisma.JsonValue | null) {
    if (!Array.isArray(jsonValue)) {
      return [] as QuotationLineItemRecord[];
    }

    return this.normalizeLineItems(jsonValue as unknown[]);
  }

  private normalizeDesigner(input?: unknown) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
      return null;
    }

    const value = input as Record<string, unknown>;

    const designer: QuotationDesignerRecord = {
      companyDisplayName: this.trimOrUndefined(value.companyDisplayName),
      logoUrl: this.trimOrUndefined(value.logoUrl),
      primaryColor: this.trimOrUndefined(value.primaryColor),
      accentColor: this.trimOrUndefined(value.accentColor),
      headerHtml: this.trimOrUndefined(value.headerHtml),
      footerHtml: this.trimOrUndefined(value.footerHtml),
    };

    return Object.values(designer).some((value) => !!value) ? designer : null;
  }

  private readDesigner(jsonValue: Prisma.JsonValue | null) {
    if (!jsonValue || typeof jsonValue !== 'object' || Array.isArray(jsonValue)) {
      return {} as QuotationDesignerRecord;
    }

    return this.normalizeDesigner(jsonValue) ?? {};
  }

  private sumLineItemsBase(items: QuotationLineItemRecord[]) {
    return Number(items.reduce((sum, item) => sum + item.lineBase, 0).toFixed(2));
  }

  private sumLineItemsTotal(items: QuotationLineItemRecord[]) {
    return Number(items.reduce((sum, item) => sum + item.lineTotal, 0).toFixed(2));
  }

  private trimOrUndefined(value: unknown) {
    if (typeof value !== 'string') {
      return undefined;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  private safeColor(value: string | undefined, fallback: string) {
    if (!value) {
      return fallback;
    }

    const hexPattern = /^#([A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/;
    return hexPattern.test(value) ? value : fallback;
  }

  private sanitizeTemplateHtml(value: string) {
    return value.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '');
  }

  private escapeHtml(value: string) {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }
}
