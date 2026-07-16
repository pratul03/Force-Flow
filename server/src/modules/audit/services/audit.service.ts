import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async recentActivity(organizationId: string) {
    const [queueJobs, walletTransactions, leaves] = await Promise.all([
      this.loadQueueJobsForOrganization(organizationId),
      this.prisma.walletTransaction.findMany({
        where: {
          wallet: {
            user: {
              organizationId,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          id: true,
          amount: true,
          currency: true,
          createdAt: true,
          wallet: {
            select: {
              userId: true,
            },
          },
        },
      }),
      this.prisma.leave.findMany({
        where: {
          user: {
            organizationId,
          },
        },
        orderBy: { updatedAt: 'desc' },
        take: 20,
        select: {
          id: true,
          userId: true,
          leaveType: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    ]);

    return {
      queueJobs,
      walletTransactions: walletTransactions.map((item) => ({
        id: item.id,
        userId: item.wallet.userId,
        amount: item.amount,
        currency: item.currency,
        createdAt: item.createdAt,
      })),
      leaves,
      generatedAt: new Date().toISOString(),
    };
  }

  private async loadQueueJobsForOrganization(organizationId: string) {
    const candidates = await this.prisma.queueJob.findMany({
      orderBy: { createdAt: 'desc' },
      take: 250,
      select: {
        id: true,
        type: true,
        status: true,
        createdAt: true,
        payload: true,
      },
    });

    return candidates
      .filter((job) => this.extractOrganizationId(job.payload) === organizationId)
      .slice(0, 20)
      .map(({ payload, ...job }) => job);
  }

  private extractOrganizationId(payload: unknown): string | null {
    if (!payload || typeof payload !== 'object') {
      return null;
    }

    const data = payload as Record<string, unknown>;
    if (typeof data.organizationId === 'string' && data.organizationId.length > 0) {
      return data.organizationId;
    }

    if (
      data.metadata &&
      typeof data.metadata === 'object' &&
      typeof (data.metadata as Record<string, unknown>).organizationId === 'string'
    ) {
      return (data.metadata as Record<string, string>).organizationId;
    }

    return null;
  }
}
