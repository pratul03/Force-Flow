import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import puppeteer from 'puppeteer';
import { ConfigService } from '@nestjs/config';
import {
  InvoiceStatus,
  InvoiceTemplate,
  QueueJob,
  TimeLogStatus,
  UserStatus,
} from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { renderTemplate } from '../../../common/templates/template-renderer';
import { GeneratePayrollDto } from '../dto/generate-payroll.dto';
import { MarkInvoicePaidDto } from '../dto/mark-invoice-paid.dto';
import { PayrollQueryDto } from '../dto/payroll-query.dto';
import { QueueService } from '../../queue/services/queue.service';

@Injectable()
export class PayrollService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queueService: QueueService,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit() {
    this.queueService.registerHandler('payroll.generate-cycle', async (job: QueueJob) => {
      const payload = job.payload as unknown as GeneratePayrollDto;
      await this.processPayrollCycle(payload);
    });
  }

  async previewUserPayroll(userId: string, month: number, year: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        organization: {
          select: {
            baseHourlyRate: true,
            overtimeMultiplier: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const logs = await this.prisma.timeLog.findMany({
      where: {
        userId,
        clockOut: { not: null },
        clockIn: {
          gte: new Date(Date.UTC(year, month - 1, 1)),
          lt: new Date(Date.UTC(year, month, 1)),
        },
      },
    });

    const workedHours = logs.reduce((acc, item) => acc + (item.totalHours ?? 0), 0);
    const overtimeHours = logs.reduce((acc, item) => acc + (item.overtimeHours ?? 0), 0);
    const defaultBaseHourlyRate = Number(
      this.configService.get('PAYROLL_BASE_HOURLY_RATE') ?? 100,
    );
    const defaultOvertimeMultiplier = Number(
      this.configService.get('PAYROLL_OT_MULTIPLIER') ?? 1.5,
    );
    const baseHourlyRate = user.organization?.baseHourlyRate ?? defaultBaseHourlyRate;
    const overtimeMultiplier =
      user.organization?.overtimeMultiplier ?? defaultOvertimeMultiplier;
    const regularHours = Math.max(0, workedHours - overtimeHours);
    const basicAmount = this.round(regularHours * baseHourlyRate);
    const overtimeAmount = this.round(overtimeHours * baseHourlyRate * overtimeMultiplier);
    const grossAmount = this.round(basicAmount + overtimeAmount);

    return {
      userId,
      month,
      year,
      workedHours,
      overtimeHours,
      basicAmount,
      overtimeAmount,
      grossAmount,
      generatedAt: new Date().toISOString(),
    };
  }

  generatePayrollCycle(input: GeneratePayrollDto) {
    return this.queueService.enqueue({
      type: 'payroll.generate-cycle',
      payload: { ...input },
      maxAttempts: 5,
    });
  }

  listInvoices(query: PayrollQueryDto) {
    return this.prisma.invoice.findMany({
      where: {
        ...(query.userId ? { userId: query.userId } : {}),
        ...(query.month ? { month: query.month } : {}),
        ...(query.year ? { year: query.year } : {}),
        ...(query.status ? { status: query.status } : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            employeeId: true,
          },
        },
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async getInvoice(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            employeeId: true,
          },
        },
        timelogs: true,
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return invoice;
  }

  async getInvoiceRenderedDocument(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            employeeId: true,
            organizationId: true,
          },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    if (invoice.renderedHtml) {
      return {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        templateKey: invoice.templateKey,
        renderedHtml: invoice.renderedHtml,
      };
    }

    const template = await this.resolveInvoiceTemplate(
      invoice.user.organizationId,
      invoice.templateKey,
    );

    const renderedHtml = this.buildInvoiceHtml(template, {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      employeeId: invoice.user.employeeId,
      employeeName: `${invoice.user.firstName} ${invoice.user.lastName}`.trim(),
      month: invoice.month,
      year: invoice.year,
      totalHours: invoice.totalHours,
      overtimeHours: invoice.overtimeHours,
      basicAmount: invoice.basicAmount,
      overtimeAmount: invoice.overtimeAmount,
      grossAmount: invoice.grossAmount,
      currency: invoice.currency,
      generatedAt: invoice.updatedAt.toISOString(),
    });

    return {
      invoiceId: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      templateKey: template?.key ?? null,
      renderedHtml,
    };
  }

  async downloadInvoicePdf(id: string) {
    const rendered = await this.getInvoiceRenderedDocument(id);
    const buffer = await this.renderInvoicePdfWithPuppeteer(rendered.renderedHtml);

    return {
      fileName: `${rendered.invoiceNumber}.pdf`,
      buffer,
    };
  }

  async markInvoicePaid(id: string, dto: MarkInvoicePaidDto) {
    const invoice = await this.getInvoice(id);

    if (invoice.status === InvoiceStatus.PAID) {
      throw new BadRequestException('Invoice is already marked as paid');
    }

    return this.prisma.invoice.update({
      where: { id },
      data: {
        status: InvoiceStatus.PAID,
        paidAt: new Date(),
        paymentReference: dto.paymentReference,
      },
    });
  }

  private async processPayrollCycle(input: GeneratePayrollDto) {
    const month = Number(input.month);
    const year = Number(input.year);

    if (!month || !year) {
      throw new BadRequestException('month and year are required for payroll generation');
    }

    const startDate = new Date(Date.UTC(year, month - 1, 1));
    const endDate = new Date(Date.UTC(year, month, 1));

    const users = await this.prisma.user.findMany({
      where: {
        status: UserStatus.ACTIVE,
        ...(input.organizationId ? { organizationId: input.organizationId } : {}),
      },
      select: {
        id: true,
        employeeId: true,
        firstName: true,
        lastName: true,
        organizationId: true,
        preferredCurrency: true,
        organization: {
          select: {
            baseHourlyRate: true,
            overtimeMultiplier: true,
          },
        },
      },
    });

    const defaultBaseHourlyRate = Number(
      this.configService.get('PAYROLL_BASE_HOURLY_RATE') ?? 100,
    );
    const defaultOvertimeMultiplier = Number(
      this.configService.get('PAYROLL_OT_MULTIPLIER') ?? 1.5,
    );

    let generatedInvoices = 0;
  const templateCache = new Map<string, InvoiceTemplate | null>();

    for (const user of users) {
      const logs = await this.prisma.timeLog.findMany({
        where: {
          userId: user.id,
          clockOut: { not: null },
          status: { not: TimeLogStatus.REJECTED },
          clockIn: {
            gte: startDate,
            lt: endDate,
          },
        },
      });

      const baseHourlyRate =
        user.organization?.baseHourlyRate ?? defaultBaseHourlyRate;
      const overtimeMultiplier =
        user.organization?.overtimeMultiplier ?? defaultOvertimeMultiplier;

      const totalHours = logs.reduce((acc, item) => acc + (item.totalHours ?? 0), 0);
      const overtimeHours = logs.reduce((acc, item) => acc + (item.overtimeHours ?? 0), 0);
      const regularHours = Math.max(0, totalHours - overtimeHours);
      const basicAmount = this.round(regularHours * baseHourlyRate);
      const overtimeAmount = this.round(overtimeHours * baseHourlyRate * overtimeMultiplier);
      const grossAmount = this.round(basicAmount + overtimeAmount);

      const existing = await this.prisma.invoice.findUnique({
        where: {
          userId_month_year: {
            userId: user.id,
            month,
            year,
          },
        },
      });

      const invoiceNumber =
        existing?.invoiceNumber ??
        this.generateInvoiceNumber(year, month, user.employeeId, users.indexOf(user) + 1);

      const invoiceTemplate = await this.resolveInvoiceTemplateWithCache(
        user.organizationId,
        templateCache,
      );
      const renderedHtml = this.buildInvoiceHtml(invoiceTemplate, {
        invoiceNumber,
        employeeId: user.employeeId,
        employeeName: `${user.firstName} ${user.lastName}`.trim(),
        month,
        year,
        totalHours,
        overtimeHours,
        basicAmount,
        overtimeAmount,
        grossAmount,
        currency: user.preferredCurrency,
        generatedAt: new Date().toISOString(),
      });

      const invoice = await this.prisma.invoice.upsert({
        where: {
          userId_month_year: {
            userId: user.id,
            month,
            year,
          },
        },
        create: {
          invoiceNumber,
          userId: user.id,
          month,
          year,
          totalHours,
          overtimeHours,
          basicAmount,
          overtimeAmount,
          grossAmount,
          currency: user.preferredCurrency,
          templateKey: invoiceTemplate?.key ?? null,
          renderedHtml,
          status: InvoiceStatus.PENDING_APPROVAL,
        },
        update: {
          totalHours,
          overtimeHours,
          basicAmount,
          overtimeAmount,
          grossAmount,
          currency: user.preferredCurrency,
          templateKey: invoiceTemplate?.key ?? null,
          renderedHtml,
          status: InvoiceStatus.PENDING_APPROVAL,
          paymentReference: null,
          paidAt: null,
        },
      });

      await this.prisma.timeLog.updateMany({
        where: { id: { in: logs.map((item) => item.id) } },
        data: {
          status: TimeLogStatus.INVOICED,
          invoiceId: invoice.id,
        },
      });

      await this.queueService.enqueue({
        type: 'notification.send',
        payload: {
          userId: user.id,
          organizationId: user.organizationId,
          channel: 'email',
          templateKey: 'PAYROLL_GENERATED',
          templateData: {
            firstName: user.firstName,
            lastName: user.lastName,
            employeeId: user.employeeId,
            invoiceId: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            month,
            year,
            grossAmount,
            currency: user.preferredCurrency,
          },
          title: 'Payroll generated',
          message: `Your invoice ${invoice.invoiceNumber} for ${month}/${year} is ready.`,
          locale: 'en',
          metadata: {
            invoiceId: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
          },
        },
      });

      generatedInvoices += 1;
    }

    return {
      month,
      year,
      generatedInvoices,
      processedUsers: users.length,
    };
  }

  private generateInvoiceNumber(
    year: number,
    month: number,
    employeeId: string,
    fallbackSequence: number,
  ) {
    const mm = String(month).padStart(2, '0');
    const seq = String(fallbackSequence).padStart(4, '0');
    return `INV/${year}/${mm}/${employeeId}/${seq}`;
  }

  private round(value: number) {
    return Math.round(value * 100) / 100;
  }

  private async resolveInvoiceTemplateWithCache(
    organizationId: string,
    cache: Map<string, InvoiceTemplate | null>,
  ) {
    if (cache.has(organizationId)) {
      return cache.get(organizationId) ?? null;
    }

    const template = await this.resolveInvoiceTemplate(organizationId);
    cache.set(organizationId, template);
    return template;
  }

  private async resolveInvoiceTemplate(
    organizationId: string,
    templateKey?: string | null,
  ) {
    if (templateKey) {
      const byKey = await this.prisma.invoiceTemplate.findUnique({
        where: {
          organizationId_key: {
            organizationId,
            key: templateKey,
          },
        },
      });

      if (byKey?.isActive) {
        return byKey;
      }
    }

    return this.prisma.invoiceTemplate.findFirst({
      where: {
        organizationId,
        isActive: true,
      },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  private buildInvoiceHtml(
    template: InvoiceTemplate | null,
    data: {
      invoiceId?: string;
      invoiceNumber: string;
      employeeId: string;
      employeeName: string;
      month: number;
      year: number;
      totalHours: number;
      overtimeHours: number;
      basicAmount: number;
      overtimeAmount: number;
      grossAmount: number;
      currency: string;
      generatedAt: string;
    },
  ) {
    if (!template) {
      return `<html><body><h1>Invoice ${data.invoiceNumber}</h1><p>Employee: ${data.employeeName} (${data.employeeId})</p><p>Period: ${data.month}/${data.year}</p><p>Total Hours: ${data.totalHours}</p><p>Overtime Hours: ${data.overtimeHours}</p><p>Basic Amount: ${data.basicAmount}</p><p>Overtime Amount: ${data.overtimeAmount}</p><p>Gross Amount: ${data.grossAmount} ${data.currency}</p><p>Generated At: ${data.generatedAt}</p></body></html>`;
    }

    const payload: Record<string, unknown> = {
      ...data,
      ...(template.variables && typeof template.variables === 'object'
        ? { templateVariables: template.variables }
        : {}),
    };

    const header = template.headerHtml ? renderTemplate(template.headerHtml, payload) : '';
    const body = renderTemplate(template.bodyHtml, payload);
    const footer = template.footerHtml ? renderTemplate(template.footerHtml, payload) : '';
    const css = template.css
      ? `<style>${template.css}</style>`
      : '<style>body{font-family:Arial,sans-serif;padding:24px;}</style>';

    return `<html><head>${css}</head><body>${header}${body}${footer}</body></html>`;
  }

  private async renderInvoicePdfWithPuppeteer(html: string) {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '16mm',
          right: '12mm',
          bottom: '16mm',
          left: '12mm',
        },
      });

      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  }
}
