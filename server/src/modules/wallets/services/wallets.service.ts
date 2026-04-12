import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { Currency, Prisma, QueueJob, TransactionStatus, TransactionType } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { QueueService } from '../../queue/services/queue.service';
import { CreateWalletTransactionDto } from '../dto/create-wallet-transaction.dto';
import { RequestWithdrawalDto } from '../dto/request-withdrawal.dto';

@Injectable()
export class WalletsService implements OnModuleInit {
  private readonly highValueWithdrawalThreshold = 100000;

  constructor(
    private readonly prisma: PrismaService,
    private readonly queueService: QueueService,
  ) {}

  onModuleInit() {
    this.queueService.registerHandler('wallet.process-withdrawal', async (job: QueueJob) => {
      await this.processWithdrawalJob(job);
    });
  }

  async getUserWallet(userId: string) {
    const wallet = await this.prisma.wallet.findUnique({
      where: { userId },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 25,
        },
      },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found for user');
    }

    return wallet;
  }

  async bootstrapWallet(userId: string, currency?: Currency) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.wallet.upsert({
      where: { userId },
      create: {
        userId,
        currency: currency ?? user.preferredCurrency,
      },
      update: {},
    });
  }

  async createTransaction(dto: CreateWalletTransactionDto) {
    const user = await this.prisma.user.findUnique({ where: { id: dto.userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const wallet = await this.prisma.wallet.upsert({
      where: { userId: dto.userId },
      create: {
        userId: dto.userId,
        currency: dto.currency ?? user.preferredCurrency,
      },
      update: {},
    });

    if (dto.type === TransactionType.DEBIT && wallet.balance < dto.amount) {
      throw new BadRequestException('Insufficient wallet balance');
    }

    const updatedWallet = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance:
            dto.type === TransactionType.DEBIT
              ? { decrement: dto.amount }
              : { increment: dto.amount },
          totalEarned:
            dto.type === TransactionType.CREDIT
              ? { increment: dto.amount }
              : undefined,
          totalWithdrawn:
            dto.type === TransactionType.DEBIT
              ? { increment: dto.amount }
              : undefined,
        },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount: dto.amount,
          currency: dto.currency ?? wallet.currency,
          type: dto.type,
          status: TransactionStatus.COMPLETED,
          description: dto.description,
          processedAt: new Date(),
        },
      });

      return updated;
    });

    return this.prisma.wallet.findUnique({
      where: { id: updatedWallet.id },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 25,
        },
      },
    });
  }

  async requestWithdrawal(dto: RequestWithdrawalDto) {
    const user = await this.prisma.user.findUnique({ where: { id: dto.userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const wallet = await this.prisma.wallet.upsert({
      where: { userId: dto.userId },
      create: {
        userId: dto.userId,
        currency: user.preferredCurrency,
      },
      update: {},
    });

    const transaction = await this.prisma.$transaction(async (tx) => {
      const reservedBalance = await tx.wallet.updateMany({
        where: {
          id: wallet.id,
          balance: { gte: dto.amount },
        },
        data: {
          balance: { decrement: dto.amount },
        },
      });

      if (reservedBalance.count === 0) {
        throw new BadRequestException('Insufficient wallet balance');
      }

      return tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount: dto.amount,
          currency: wallet.currency,
          type: TransactionType.DEBIT,
          status: TransactionStatus.PENDING,
          description: dto.description ?? 'Wallet withdrawal requested',
        },
      });
    });

    const job = await this.queueService.enqueue({
      type: 'wallet.process-withdrawal',
      payload: {
        transactionId: transaction.id,
        userId: dto.userId,
      },
      maxAttempts: 3,
    });

    await this.enqueueNotification({
      userId: dto.userId,
      channel: 'email',
      title: 'Withdrawal requested',
      message: `Your withdrawal request of ${transaction.amount} ${transaction.currency} is queued for processing.`,
      locale: 'en',
      metadata: {
        transactionId: transaction.id,
        amount: transaction.amount,
        currency: transaction.currency,
      },
    });

    return {
      transaction,
      queueJobId: job.id,
    };
  }

  async retryWithdrawal(transactionId: string) {
    const transaction = await this.prisma.walletTransaction.findUnique({
      where: { id: transactionId },
      include: { wallet: true },
    });

    if (!transaction) {
      throw new NotFoundException('Withdrawal transaction not found');
    }

    if (transaction.status !== TransactionStatus.FAILED) {
      throw new BadRequestException('Only failed withdrawals can be retried');
    }

    await this.prisma.$transaction(async (tx) => {
      const reservedBalance = await tx.wallet.updateMany({
        where: {
          id: transaction.walletId,
          balance: { gte: transaction.amount },
        },
        data: {
          balance: { decrement: transaction.amount },
        },
      });

      if (reservedBalance.count === 0) {
        throw new BadRequestException('Insufficient wallet balance to retry withdrawal');
      }

      await tx.walletTransaction.update({
        where: { id: transaction.id },
        data: {
          status: TransactionStatus.PENDING,
          processedAt: null,
          failureReason: null,
          payoutId: null,
        },
      });
    });

    const job = await this.queueService.enqueue({
      type: 'wallet.process-withdrawal',
      payload: {
        transactionId: transaction.id,
        userId: transaction.wallet.userId,
      },
      maxAttempts: 3,
    });

    return {
      transactionId: transaction.id,
      queueJobId: job.id,
      status: TransactionStatus.PENDING,
    };
  }

  async listTransactions(userId?: string) {
    if (!userId) {
      return this.prisma.walletTransaction.findMany({
        orderBy: { createdAt: 'desc' },
        take: 100,
      });
    }

    const wallet = await this.prisma.wallet.findUnique({ where: { userId } });
    if (!wallet) {
      return [];
    }

    return this.prisma.walletTransaction.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  private async processWithdrawalJob(job: QueueJob) {
    const payload = job.payload as Prisma.JsonObject;
    const transactionId =
      typeof payload.transactionId === 'string' ? payload.transactionId : null;

    if (!transactionId) {
      throw new BadRequestException('transactionId is required for wallet.process-withdrawal');
    }

    const lock = await this.prisma.walletTransaction.updateMany({
      where: {
        id: transactionId,
        status: {
          in: [TransactionStatus.PENDING, TransactionStatus.PROCESSING],
        },
      },
      data: {
        status: TransactionStatus.PROCESSING,
      },
    });

    if (lock.count === 0) {
      return;
    }

    const transaction = await this.prisma.walletTransaction.findUnique({
      where: { id: transactionId },
      include: { wallet: true },
    });

    if (!transaction) {
      return;
    }

    const shouldFail = transaction.amount > this.highValueWithdrawalThreshold;

    if (shouldFail) {
      await this.markWithdrawalFailed(
        transaction,
        'Withdrawal exceeds automated payout threshold and requires manual intervention',
      );
      return;
    }

    const payoutId = `payout_${Date.now()}_${transaction.id.slice(-6)}`;

    await this.prisma.$transaction(async (tx) => {
      await tx.walletTransaction.update({
        where: { id: transaction.id },
        data: {
          status: TransactionStatus.COMPLETED,
          payoutId,
          processedAt: new Date(),
          failureReason: null,
        },
      });

      await tx.wallet.update({
        where: { id: transaction.walletId },
        data: {
          totalWithdrawn: { increment: transaction.amount },
        },
      });
    });

    await this.enqueueNotification({
      userId: transaction.wallet.userId,
      channel: 'email',
      title: 'Withdrawal completed',
      message: `Your withdrawal of ${transaction.amount} ${transaction.currency} has been processed successfully.`,
      locale: 'en',
      metadata: {
        transactionId: transaction.id,
        payoutId,
      },
    });
  }

  private async markWithdrawalFailed(
    transaction: {
      id: string;
      walletId: string;
      amount: number;
      wallet: { userId: string };
      currency: Currency;
    },
    reason: string,
  ) {
    await this.prisma.$transaction(async (tx) => {
      await tx.walletTransaction.update({
        where: { id: transaction.id },
        data: {
          status: TransactionStatus.FAILED,
          failureReason: reason,
          processedAt: new Date(),
        },
      });

      await tx.wallet.update({
        where: { id: transaction.walletId },
        data: {
          balance: { increment: transaction.amount },
        },
      });
    });

    await this.enqueueNotification({
      userId: transaction.wallet.userId,
      channel: 'email',
      title: 'Withdrawal failed',
      message: `Your withdrawal of ${transaction.amount} ${transaction.currency} failed: ${reason}`,
      locale: 'en',
      metadata: {
        transactionId: transaction.id,
        failureReason: reason,
      },
    });
  }

  private enqueueNotification(payload: {
    userId: string;
    channel: string;
    title: string;
    message: string;
    locale: string;
    metadata: Record<string, unknown>;
  }) {
    return this.queueService.enqueue({
      type: 'notification.send',
      payload,
      maxAttempts: 5,
    });
  }
}
