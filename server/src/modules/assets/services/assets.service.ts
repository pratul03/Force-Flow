import {
  BadRequestException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import {
  AssetStatus,
  Prisma,
  QueueJob,
  QueueJobStatus,
} from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { QueueService } from '../../queue/services/queue.service';
import { AssetQueryDto } from '../dto/asset-query.dto';
import { AssignAssetDto } from '../dto/assign-asset.dto';
import { CreateAssetDto } from '../dto/create-asset.dto';
import { RunDepreciationDto } from '../dto/run-depreciation.dto';

@Injectable()
export class AssetsService implements OnModuleInit {
  constructor(
    private readonly queueService: QueueService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit() {
    this.queueService.registerHandler('assets.run-depreciation', async (job: QueueJob) => {
      await this.processDepreciation(job);
    });
  }

  async getStatus(organizationId?: string) {
    const where = organizationId ? { organizationId } : undefined;

    const [assetsCount, statusCounts, queuedJobs] = await Promise.all([
      this.prisma.asset.count({ where }),
      this.prisma.asset.groupBy({
        by: ['status'],
        where,
        _count: { _all: true },
      }),
      this.prisma.queueJob.count({
        where: {
          type: 'assets.run-depreciation',
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
      module: 'assets',
      status: 'active',
      organizationId: organizationId ?? null,
      assetsCount,
      statusCounts: statusCounts.map((item) => ({
        status: item.status,
        count: item._count._all,
      })),
      queuedJobs,
      generatedAt: new Date().toISOString(),
    };
  }

  listAssets(query: AssetQueryDto) {
    return this.prisma.asset.findMany({
      where: {
        ...(query.organizationId ? { organizationId: query.organizationId } : {}),
        ...(query.assignedToUserId ? { assignedToUserId: query.assignedToUserId } : {}),
        ...(query.status ? { status: query.status } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: query.limit ?? 100,
    });
  }

  async createAsset(dto: CreateAssetDto) {
    const org = await this.prisma.organization.findUnique({
      where: { id: dto.organizationId },
      select: { id: true },
    });

    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    if (dto.assignedToUserId) {
      const user = await this.prisma.user.findUnique({
        where: { id: dto.assignedToUserId },
        select: { id: true, organizationId: true },
      });

      if (!user || user.organizationId !== dto.organizationId) {
        throw new BadRequestException('Assigned user must belong to the same organization');
      }
    }

    const purchaseCost = dto.purchaseCost;
    const salvageValue = dto.salvageValue ?? 0;

    if (salvageValue > purchaseCost) {
      throw new BadRequestException('salvageValue cannot be greater than purchaseCost');
    }

    return this.prisma.asset.create({
      data: {
        organizationId: dto.organizationId,
        assetCode: dto.assetCode,
        name: dto.name,
        category: dto.category,
        status:
          dto.status ?? (dto.assignedToUserId ? AssetStatus.ASSIGNED : AssetStatus.AVAILABLE),
        assignedToUserId: dto.assignedToUserId,
        purchaseDate: new Date(dto.purchaseDate),
        purchaseCost,
        salvageValue,
        usefulLifeMonths: dto.usefulLifeMonths ?? 36,
        netBookValue: purchaseCost,
        notes: dto.notes,
      },
    });
  }

  async assignAsset(assetId: string, dto: AssignAssetDto) {
    const asset = await this.prisma.asset.findUnique({ where: { id: assetId } });

    if (!asset) {
      throw new NotFoundException('Asset not found');
    }

    if (dto.assignedToUserId) {
      const user = await this.prisma.user.findUnique({
        where: { id: dto.assignedToUserId },
        select: { id: true, organizationId: true },
      });

      if (!user || user.organizationId !== asset.organizationId) {
        throw new BadRequestException('Assigned user must belong to the same organization');
      }
    }

    const status =
      dto.status ?? (dto.assignedToUserId ? AssetStatus.ASSIGNED : AssetStatus.AVAILABLE);

    return this.prisma.asset.update({
      where: { id: assetId },
      data: {
        assignedToUserId: dto.assignedToUserId ?? null,
        status,
        notes: dto.notes ?? asset.notes,
      },
    });
  }

  runDepreciation(dto: RunDepreciationDto = {}) {
    return this.queueService.enqueue({
      type: 'assets.run-depreciation',
      payload: {
        ...dto,
        requestedAt: new Date().toISOString(),
      },
      maxAttempts: 5,
    });
  }

  private async processDepreciation(job: QueueJob) {
    const payload = job.payload as Prisma.JsonObject;
    const organizationId =
      typeof payload.organizationId === 'string' ? payload.organizationId : null;
    const limit =
      typeof payload.limit === 'number' && Number.isInteger(payload.limit)
        ? Math.max(1, Math.min(500, payload.limit))
        : 200;
    const asOfDate =
      typeof payload.asOfDate === 'string' ? new Date(payload.asOfDate) : new Date();

    const cycleStart = new Date(
      Date.UTC(asOfDate.getUTCFullYear(), asOfDate.getUTCMonth(), 1),
    );

    const assets = await this.prisma.asset.findMany({
      where: {
        ...(organizationId ? { organizationId } : {}),
        status: {
          in: [AssetStatus.AVAILABLE, AssetStatus.ASSIGNED, AssetStatus.UNDER_MAINTENANCE],
        },
        purchaseDate: { lte: asOfDate },
      },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });

    let depreciatedCount = 0;
    let totalDepreciationAmount = 0;

    for (const asset of assets) {
      if (asset.usefulLifeMonths <= 0 || asset.purchaseCost <= asset.salvageValue) {
        continue;
      }

      if (asset.lastDepreciationAt && asset.lastDepreciationAt >= cycleStart) {
        continue;
      }

      const monthlyDepreciation =
        (asset.purchaseCost - asset.salvageValue) / asset.usefulLifeMonths;

      const remainingDepreciable =
        asset.purchaseCost - asset.salvageValue - asset.accumulatedDepreciation;

      const depreciationAmount = Math.max(
        0,
        Math.min(remainingDepreciable, monthlyDepreciation),
      );

      if (depreciationAmount <= 0) {
        continue;
      }

      const nextAccumulated = asset.accumulatedDepreciation + depreciationAmount;
      const nextBookValue = Math.max(asset.salvageValue, asset.purchaseCost - nextAccumulated);

      await this.prisma.asset.update({
        where: { id: asset.id },
        data: {
          accumulatedDepreciation: nextAccumulated,
          netBookValue: nextBookValue,
          lastDepreciationAt: asOfDate,
        },
      });

      depreciatedCount += 1;
      totalDepreciationAmount += depreciationAmount;
    }

    await this.queueService.enqueue({
      type: 'notification.send',
      payload: {
        channel: 'email',
        title: 'Asset depreciation cycle completed',
        message: `Depreciation processed for ${depreciatedCount} assets.`,
        locale: 'en',
        metadata: {
          organizationId,
          depreciatedCount,
          totalDepreciationAmount,
          asOfDate: asOfDate.toISOString(),
        },
      },
      maxAttempts: 3,
    });
  }
}
