import {
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import {
  Currency,
  InvoiceStatus,
  Prisma,
  QueueJob,
  QueueJobStatus,
  TransactionStatus,
  TransactionType,
} from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { QueueService } from '../../queue/services/queue.service';
import { CompensationPreviewDto } from '../dto/compensation-preview.dto';
import { CompensationSettlementQueryDto } from '../dto/compensation-settlement-query.dto';
import { RecalculateCompensationDto } from '../dto/recalculate-compensation.dto';

@Injectable()
export class CompensationService implements OnModuleInit {
  constructor(
    private readonly queueService: QueueService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit() {
    this.queueService.registerHandler('compensation.recalculate', async (job: QueueJob) => {
      await this.processRecalculateJob(job);
    });
  }

  async getStatus() {
    const [paidInvoices, settlementTransactions, queuedJobs] = await Promise.all([
      this.prisma.invoice.count({ where: { status: InvoiceStatus.PAID } }),
      this.prisma.walletTransaction.count({
        where: {
          type: TransactionType.CREDIT,
          payoutId: { startsWith: 'invoice:' },
        },
      }),
      this.prisma.queueJob.count({
        where: {
          type: 'compensation.recalculate',
          status: {
            in: [
              QueueJobStatus.PENDING,
              QueueJobStatus.RETRY,
              QueueJobStatus.PROCESSING,
            ],
          },
        },
      }),
    ]);

    return {
      module: 'compensation',
      status: 'active',
      paidInvoices,
      settlementTransactions,
      unsettledPaidInvoices: Math.max(0, paidInvoices - settlementTransactions),
      queuedJobs,
      generatedAt: new Date().toISOString(),
    };
  }

  recalculate(dto: RecalculateCompensationDto = {}) {
    return this.queueService.enqueue({
      type: 'compensation.recalculate',
      payload: {
        ...dto,
        requestedAt: new Date().toISOString(),
      },
      maxAttempts: 5,
    });
  }

  async previewUserCompensation(userId: string, dto: CompensationPreviewDto) {
    const invoice = await this.prisma.invoice.findUnique({
      where: {
        userId_month_year: {
          userId,
          month: dto.month,
          year: dto.year,
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found for selected cycle');
    }

    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
      select: {
        id: true,
        balance: true,
        currency: true,
      },
    });

    const settlementRef = `invoice:${invoice.id}`;
    const settlement = wallet
      ? await this.prisma.walletTransaction.findFirst({
          where: {
            walletId: wallet.id,
            type: TransactionType.CREDIT,
            payoutId: settlementRef,
          },
          orderBy: { createdAt: 'desc' },
        })
      : null;

    return {
      userId,
      cycle: { month: dto.month, year: dto.year },
      invoice: {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        status: invoice.status,
        grossAmount: invoice.grossAmount,
        currency: invoice.currency,
      },
      settlement: settlement
        ? {
            id: settlement.id,
            amount: settlement.amount,
            status: settlement.status,
            payoutId: settlement.payoutId,
            processedAt: settlement.processedAt,
          }
        : null,
      wallet: wallet
        ? {
            balance: wallet.balance,
            currency: wallet.currency,
          }
        : null,
      isSettled: Boolean(settlement),
    };
  }

  listSettlements(query: CompensationSettlementQueryDto) {
    const where: Prisma.WalletTransactionWhereInput = {
      type: TransactionType.CREDIT,
      payoutId: { startsWith: 'invoice:' },
    };

    if (query.userId || query.organizationId) {
      where.wallet = {
        ...(query.userId ? { userId: query.userId } : {}),
        ...(query.organizationId
          ? {
              user: {
                organizationId: query.organizationId,
              },
            }
          : {}),
      };
    }

    if (query.month && query.year) {
      const start = new Date(Date.UTC(query.year, query.month - 1, 1));
      const end = new Date(Date.UTC(query.year, query.month, 1));
      where.processedAt = {
        gte: start,
        lt: end,
      };
    }

    return this.prisma.walletTransaction.findMany({
      where,
      include: {
        wallet: {
          select: {
            id: true,
            userId: true,
            currency: true,
            user: {
              select: {
                id: true,
                email: true,
                employeeId: true,
                organizationId: true,
              },
            },
          },
        },
      },
      orderBy: { processedAt: 'desc' },
      take: query.limit ?? 100,
    });
  }

  private async processRecalculateJob(job: QueueJob) {
    const payload = job.payload as Prisma.JsonObject;
    const month =
      typeof payload.month === 'number' && Number.isInteger(payload.month)
        ? payload.month
        : null;
    const year =
      typeof payload.year === 'number' && Number.isInteger(payload.year)
        ? payload.year
        : null;
    const organizationId =
      typeof payload.organizationId === 'string' ? payload.organizationId : null;
    const userId = typeof payload.userId === 'string' ? payload.userId : null;

    const invoices = await this.prisma.invoice.findMany({
      where: {
        status: InvoiceStatus.PAID,
        ...(month ? { month } : {}),
        ...(year ? { year } : {}),
        ...(userId ? { userId } : {}),
        ...(organizationId
          ? {
              user: {
                organizationId,
              },
            }
          : {}),
      },
      include: {
        user: {
          select: {
            preferredCurrency: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    let settledCount = 0;
    let skippedCurrencyMismatch = 0;
    let settledAmount = 0;

    for (const invoice of invoices) {
      const result = await this.settlePaidInvoice({
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        userId: invoice.userId,
        grossAmount: invoice.grossAmount,
        currency: invoice.currency,
        userPreferredCurrency: invoice.user.preferredCurrency,
      });

      if (!result) {
        continue;
      }

      if (result === 'currency_mismatch') {
        skippedCurrencyMismatch += 1;
        continue;
      }

      settledCount += 1;
      settledAmount += invoice.grossAmount;
    }

    await this.queueService.enqueue({
      type: 'notification.send',
      payload: {
        channel: 'email',
        title: 'Compensation recalculation completed',
        message: `Settled ${settledCount} paid invoices. Currency mismatch skips: ${skippedCurrencyMismatch}.`,
        locale: 'en',
        metadata: {
          settledCount,
          skippedCurrencyMismatch,
          settledAmount,
        },
      },
      maxAttempts: 3,
    });
  }

  private async settlePaidInvoice(invoice: {
    id: string;
    invoiceNumber: string;
    userId: string;
    grossAmount: number;
    currency: Currency;
    userPreferredCurrency: Currency;
  }) {
    const wallet = await this.prisma.wallet.upsert({
      where: { userId: invoice.userId },
      create: {
        userId: invoice.userId,
        currency: invoice.userPreferredCurrency,
      },
      update: {},
    });

    if (wallet.currency !== invoice.currency) {
      return 'currency_mismatch' as const;
    }

    const settlementRef = `invoice:${invoice.id}`;

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.walletTransaction.findFirst({
        where: {
          walletId: wallet.id,
          type: TransactionType.CREDIT,
          payoutId: settlementRef,
        },
      });

      if (existing) {
        return null;
      }

      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: { increment: invoice.grossAmount },
          totalEarned: { increment: invoice.grossAmount },
        },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount: invoice.grossAmount,
          currency: wallet.currency,
          type: TransactionType.CREDIT,
          status: TransactionStatus.COMPLETED,
          description: `Payroll settlement for ${invoice.invoiceNumber}`,
          payoutId: settlementRef,
          processedAt: new Date(),
        },
      });

      return 'settled' as const;
    });
  }
}
