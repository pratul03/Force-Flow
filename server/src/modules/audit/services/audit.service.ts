import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async recentActivity() {
    const [queueJobs, walletTransactions, leaves] = await Promise.all([
      this.prisma.queueJob.findMany({ orderBy: { createdAt: 'desc' }, take: 20 }),
      this.prisma.walletTransaction.findMany({ orderBy: { createdAt: 'desc' }, take: 20 }),
      this.prisma.leave.findMany({ orderBy: { updatedAt: 'desc' }, take: 20 }),
    ]);

    return {
      queueJobs,
      walletTransactions,
      leaves,
      generatedAt: new Date().toISOString(),
    };
  }
}
