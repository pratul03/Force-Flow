import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async overview() {
    const [organizations, users, leaves, timelogs, wallets, queuePending] =
      await Promise.all([
        this.prisma.organization.count(),
        this.prisma.user.count(),
        this.prisma.leave.count(),
        this.prisma.timeLog.count(),
        this.prisma.wallet.count(),
        this.prisma.queueJob.count({ where: { status: 'PENDING' } }),
      ]);

    return {
      organizations,
      users,
      leaves,
      timelogs,
      wallets,
      queuePending,
      generatedAt: new Date().toISOString(),
    };
  }
}
