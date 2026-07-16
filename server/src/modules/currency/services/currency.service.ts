import { Injectable, OnModuleInit } from '@nestjs/common';
import { Currency, Prisma, QueueJob, Role } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { QueueService } from '../../queue/services/queue.service';
import { CurrencyHistoryQueryDto } from '../dto/currency-history-query.dto';

@Injectable()
export class CurrencyService implements OnModuleInit {
  private readonly adminRoles = new Set<Role>([
    Role.SUPER_ADMIN,
    Role.ADMIN,
    Role.HR_MANAGER,
  ]);

  private readonly inrBaseRates: Record<Currency, number> = {
    INR: 1,
    USD: 0.012,
    EUR: 0.011,
    GBP: 0.0095,
    AED: 0.044,
  };

  constructor(
    private readonly queueService: QueueService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit() {
    this.queueService.registerHandler('currency.sync-rates', async (job: QueueJob) => {
      await this.processSyncRatesJob(job);
    });
  }

  async getRates(baseCurrency: Currency = Currency.INR) {
    const snapshot = await this.getLatestSnapshot(baseCurrency);

    return {
      id: snapshot.id,
      baseCurrency: snapshot.baseCurrency,
      source: snapshot.source,
      fetchedAt: snapshot.fetchedAt,
      rates: this.extractRates(snapshot.rates),
    };
  }

  async convert(
    amount: number,
    from: Currency,
    to: Currency,
    context?: Record<string, unknown>,
    actor?: { actorUserId: string; organizationId: string; role: Role },
  ) {
    const snapshot = await this.getLatestSnapshot(Currency.INR);
    const rates = this.extractRates(snapshot.rates);
    const fromRate = rates[from];
    const toRate = rates[to];

    const convertedAmount =
      from === to ? amount : this.round((amount / fromRate) * toRate, 6);
    const exchangeRate = amount === 0 ? 0 : this.round(convertedAmount / amount, 8);

    const mergedContext = {
      ...(context ?? {}),
      ...(actor
        ? {
            actorUserId: actor.actorUserId,
            organizationId: actor.organizationId,
          }
        : {}),
    };

    const conversion = await this.prisma.currencyConversion.create({
      data: {
        snapshotId: snapshot.id,
        amount,
        fromCurrency: from,
        toCurrency: to,
        convertedAmount,
        exchangeRate,
        context: mergedContext as Prisma.InputJsonValue,
      },
    });

    return {
      id: conversion.id,
      amount: conversion.amount,
      fromCurrency: conversion.fromCurrency,
      toCurrency: conversion.toCurrency,
      convertedAmount: conversion.convertedAmount,
      exchangeRate: conversion.exchangeRate,
      createdAt: conversion.createdAt,
      snapshot: {
        id: snapshot.id,
        baseCurrency: snapshot.baseCurrency,
        source: snapshot.source,
        fetchedAt: snapshot.fetchedAt,
      },
    };
  }

  requestRateSync(
    source = 'manual',
    actor?: { actorUserId: string; organizationId: string },
  ) {
    return this.queueService.enqueue({
      type: 'currency.sync-rates',
      payload: {
        source,
        ...(actor
          ? {
              actorUserId: actor.actorUserId,
              organizationId: actor.organizationId,
            }
          : {}),
      },
      maxAttempts: 3,
    });
  }

  async listConversionHistory(
    query: CurrencyHistoryQueryDto,
    actor: { actorUserId: string; organizationId: string; role: Role },
  ) {
    const fetchSize = Math.min((query.limit ?? 100) * 5, 1000);
    const isAdmin = this.adminRoles.has(actor.role);

    const conversions = await this.prisma.currencyConversion.findMany({
      include: {
        snapshot: {
          select: {
            id: true,
            baseCurrency: true,
            source: true,
            fetchedAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: fetchSize,
    });

    return conversions
      .filter((conversion) => {
        const context = conversion.context;
        if (!context || typeof context !== 'object' || Array.isArray(context)) {
          return false;
        }

        const record = context as Record<string, unknown>;
        if (record.organizationId !== actor.organizationId) {
          return false;
        }

        if (isAdmin) {
          return true;
        }

        return record.actorUserId === actor.actorUserId;
      })
      .slice(0, query.limit ?? 100);
  }

  private async processSyncRatesJob(job: QueueJob) {
    const payload = job.payload as Prisma.JsonObject;
    const source =
      typeof payload.source === 'string' && payload.source.length > 0
        ? payload.source
        : 'scheduler';

    const rates = this.generateMockRates(Currency.INR);

    await this.prisma.exchangeRateSnapshot.create({
      data: {
        baseCurrency: Currency.INR,
        source,
        rates: rates as Prisma.InputJsonValue,
        fetchedAt: new Date(),
      },
    });
  }

  private async getLatestSnapshot(baseCurrency: Currency) {
    const snapshot = await this.prisma.exchangeRateSnapshot.findFirst({
      where: { baseCurrency },
      orderBy: { fetchedAt: 'desc' },
    });

    if (snapshot) {
      return snapshot;
    }

    return this.prisma.exchangeRateSnapshot.create({
      data: {
        baseCurrency,
        source: 'bootstrap',
        rates: this.generateMockRates(baseCurrency) as Prisma.InputJsonValue,
        fetchedAt: new Date(),
      },
    });
  }

  private extractRates(rates: Prisma.JsonValue) {
    const raw = (rates ?? {}) as Record<string, unknown>;

    return {
      INR: this.asPositiveNumber(raw.INR, this.inrBaseRates.INR),
      USD: this.asPositiveNumber(raw.USD, this.inrBaseRates.USD),
      EUR: this.asPositiveNumber(raw.EUR, this.inrBaseRates.EUR),
      GBP: this.asPositiveNumber(raw.GBP, this.inrBaseRates.GBP),
      AED: this.asPositiveNumber(raw.AED, this.inrBaseRates.AED),
    } as Record<Currency, number>;
  }

  private generateMockRates(baseCurrency: Currency) {
    const jitteredInrRates: Record<Currency, number> = {
      INR: 1,
      USD: this.round(0.0115 + Math.random() * 0.0015, 6),
      EUR: this.round(0.0105 + Math.random() * 0.0015, 6),
      GBP: this.round(0.009 + Math.random() * 0.0012, 6),
      AED: this.round(0.043 + Math.random() * 0.002, 6),
    };

    if (baseCurrency === Currency.INR) {
      return jitteredInrRates;
    }

    const divisor = jitteredInrRates[baseCurrency] || this.inrBaseRates[baseCurrency];

    return {
      INR: this.round(jitteredInrRates.INR / divisor, 6),
      USD: this.round(jitteredInrRates.USD / divisor, 6),
      EUR: this.round(jitteredInrRates.EUR / divisor, 6),
      GBP: this.round(jitteredInrRates.GBP / divisor, 6),
      AED: this.round(jitteredInrRates.AED / divisor, 6),
    };
  }

  private asPositiveNumber(value: unknown, fallback: number) {
    if (typeof value !== 'number' || Number.isNaN(value) || value <= 0) {
      return fallback;
    }

    return value;
  }

  private round(value: number, digits: number) {
    const factor = 10 ** digits;
    return Math.round(value * factor) / factor;
  }
}
