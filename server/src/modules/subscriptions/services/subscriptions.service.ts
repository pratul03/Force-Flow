import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  BillingProvider,
  OrganizationSubscriptionStatus,
  Prisma,
  Role,
  SubscriptionCheckoutStatus,
  SubscriptionEventType,
  SubscriptionInterval,
} from '@prisma/client';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../../prisma/prisma.service';
import { RazorpayService } from '../../razorpay/services/razorpay.service';
import { CreateCheckoutSessionDto } from '../dto/create-checkout-session.dto';
import { SubscriptionWebhookDto } from '../dto/subscription-webhook.dto';

type AuthenticatedUser = {
  sub: string;
  organizationId: string;
  role: Role | string;
};

@Injectable()
export class SubscriptionsService {
  private readonly managerRoles = new Set<Role>([
    Role.SUPER_ADMIN,
    Role.ADMIN,
    Role.HR_MANAGER,
    Role.MANAGER,
  ]);

  constructor(
    private readonly prisma: PrismaService,
    private readonly razorpayService: RazorpayService,
  ) {}

  assertWebhookSecret(receivedSecret?: string) {
    const configuredSecret = process.env.SUBSCRIPTION_WEBHOOK_SECRET?.trim();

    if (!configuredSecret) {
      return;
    }

    if (!receivedSecret || receivedSecret !== configuredSecret) {
      throw new ForbiddenException('Invalid subscription webhook secret');
    }
  }

  listPlans() {
    return this.prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async getCurrentSubscription(user: AuthenticatedUser) {
    return this.prisma.organizationSubscription.findUnique({
      where: { organizationId: user.organizationId },
      include: {
        plan: true,
      },
    });
  }

  async createCheckoutSession(user: AuthenticatedUser, dto: CreateCheckoutSessionDto) {
    this.assertManagerRole(user.role);

    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { code: dto.planCode },
    });

    if (!plan || !plan.isActive) {
      throw new NotFoundException('Subscription plan not found');
    }

    const provider = dto.provider ?? BillingProvider.RAZORPAY;
    if (provider !== BillingProvider.RAZORPAY) {
      throw new BadRequestException('Only Razorpay is supported for subscription checkout');
    }

    const token = randomBytes(24).toString('hex');

    const appUrl = (process.env.PUBLIC_APP_URL ?? 'http://localhost:3000').replace(/\/$/, '');
    const successUrl = dto.successUrl ?? `${appUrl}/pricing/checkout`;
    const cancelUrl = dto.cancelUrl ?? `${appUrl}/pricing`;

    const razorpayCheckoutSession = await this.razorpayService.createCheckoutSession({
      organizationId: user.organizationId,
      planId: plan.id,
      planCode: plan.code,
      planName: plan.name,
      planDescription: plan.description,
      interval: plan.interval,
      price: plan.price,
      currency: plan.currency,
      trialDays: plan.trialDays,
      sessionToken: token,
      successUrl,
      cancelUrl,
    });

    const created = await this.prisma.$transaction(async (tx) => {
      const session = await tx.subscriptionCheckoutSession.create({
        data: {
          token,
          organizationId: user.organizationId,
          planId: plan.id,
          provider: razorpayCheckoutSession.provider,
          providerSessionId: razorpayCheckoutSession.providerSessionId,
          status: SubscriptionCheckoutStatus.PENDING,
          checkoutUrl: razorpayCheckoutSession.checkoutUrl,
          successUrl,
          cancelUrl,
          expiresAt: razorpayCheckoutSession.expiresAt,
          createdByUserId: user.sub,
        },
        include: {
          plan: true,
        },
      });

      await tx.subscriptionEvent.create({
        data: {
          organizationId: user.organizationId,
          checkoutSessionId: session.id,
          type: SubscriptionEventType.CHECKOUT_CREATED,
          provider,
          payload: {
            planCode: plan.code,
            providerSessionId: razorpayCheckoutSession.providerSessionId,
            expiresAt: razorpayCheckoutSession.expiresAt.toISOString(),
          } as Prisma.InputJsonValue,
        },
      });

      return session;
    });

    return {
      sessionToken: created.token,
      checkoutUrl: created.checkoutUrl,
      expiresAt: created.expiresAt,
      provider: created.provider,
      plan: created.plan,
    };
  }

  async completeCheckoutSession(user: AuthenticatedUser, token: string) {
    this.assertManagerRole(user.role);

    const session = await this.prisma.subscriptionCheckoutSession.findUnique({
      where: { token },
      include: {
        plan: true,
      },
    });

    if (!session) {
      throw new NotFoundException('Checkout session not found');
    }

    if (session.organizationId !== user.organizationId) {
      throw new ForbiddenException('Checkout session is not part of your organization');
    }

    if (session.status === SubscriptionCheckoutStatus.COMPLETED) {
      const subscription = await this.prisma.organizationSubscription.findUnique({
        where: { organizationId: session.organizationId },
        include: { plan: true },
      });

      return {
        subscription,
        session,
      };
    }

    if (session.status !== SubscriptionCheckoutStatus.PENDING) {
      throw new BadRequestException('Checkout session is not pending');
    }

    if (session.expiresAt.getTime() < Date.now()) {
      await this.prisma.subscriptionCheckoutSession.update({
        where: { id: session.id },
        data: { status: SubscriptionCheckoutStatus.EXPIRED },
      });
      throw new BadRequestException('Checkout session has expired');
    }

    const now = new Date();
    const periodEnd = this.addInterval(now, session.plan.interval);
    const trialEnd = session.plan.trialDays > 0 ? this.addDays(now, session.plan.trialDays) : null;
    const status =
      session.plan.trialDays > 0
        ? OrganizationSubscriptionStatus.TRIALING
        : OrganizationSubscriptionStatus.ACTIVE;

    const result = await this.prisma.$transaction(async (tx) => {
      const subscription = await tx.organizationSubscription.upsert({
        where: { organizationId: session.organizationId },
        create: {
          organizationId: session.organizationId,
          planId: session.planId,
          provider: session.provider,
          status,
          providerSubscriptionId: session.providerSessionId,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          trialStart: trialEnd ? now : null,
          trialEnd,
          canceledAt: null,
          createdByUserId: user.sub,
          metadata: {
            lastCheckoutSessionToken: session.token,
          } as Prisma.InputJsonValue,
        },
        update: {
          planId: session.planId,
          provider: session.provider,
          status,
          providerSubscriptionId: session.providerSessionId,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          trialStart: trialEnd ? now : null,
          trialEnd,
          canceledAt: null,
          createdByUserId: user.sub,
          metadata: {
            lastCheckoutSessionToken: session.token,
          } as Prisma.InputJsonValue,
        },
        include: {
          plan: true,
        },
      });

      const completedSession = await tx.subscriptionCheckoutSession.update({
        where: { id: session.id },
        data: {
          status: SubscriptionCheckoutStatus.COMPLETED,
          completedAt: now,
        },
      });

      await tx.subscriptionEvent.createMany({
        data: [
          {
            organizationId: session.organizationId,
            checkoutSessionId: session.id,
            organizationSubscriptionId: subscription.id,
            type: SubscriptionEventType.CHECKOUT_COMPLETED,
            provider: session.provider,
            payload: {
              sessionToken: session.token,
              completedAt: now.toISOString(),
            } as Prisma.InputJsonValue,
          },
          {
            organizationId: session.organizationId,
            checkoutSessionId: session.id,
            organizationSubscriptionId: subscription.id,
            type: SubscriptionEventType.SUBSCRIPTION_ACTIVATED,
            provider: session.provider,
            payload: {
              status,
              trialEnd: trialEnd?.toISOString() ?? null,
              currentPeriodEnd: periodEnd.toISOString(),
            } as Prisma.InputJsonValue,
          },
        ],
      });

      return {
        subscription,
        session: completedSession,
      };
    });

    return result;
  }

  async processRazorpayWebhook(payload: Record<string, unknown>) {
    const eventType =
      typeof payload.event === 'string' ? payload.event.trim().toLowerCase() : '';

    const paymentLinkEntity = this.asRecord(
      this.asRecord(this.asRecord(payload.payload)?.payment_link)?.entity,
    );
    const paymentEntity = this.asRecord(
      this.asRecord(this.asRecord(payload.payload)?.payment)?.entity,
    );
    const notes = this.asRecord(paymentLinkEntity?.notes);

    const sessionToken =
      typeof notes?.sessionToken === 'string' ? notes.sessionToken : undefined;
    const providerSessionId =
      typeof paymentLinkEntity?.id === 'string' ? paymentLinkEntity.id : undefined;
    const providerPaymentId =
      typeof paymentEntity?.id === 'string' ? paymentEntity.id : providerSessionId;

    const session = sessionToken
      ? await this.prisma.subscriptionCheckoutSession.findUnique({
          where: { token: sessionToken },
          include: { plan: true },
        })
      : providerSessionId
        ? await this.prisma.subscriptionCheckoutSession.findFirst({
            where: {
              provider: BillingProvider.RAZORPAY,
              providerSessionId,
            },
            include: { plan: true },
          })
        : null;

    if (!session) {
      return {
        received: true,
        updated: false,
        reason: 'No matching checkout session found',
      };
    }

    if (eventType === 'payment_link.paid' || eventType === 'payment.captured') {
      if (session.status === SubscriptionCheckoutStatus.PENDING) {
        const now = new Date();
        const periodEnd = this.addInterval(now, session.plan.interval);
        const trialEnd =
          session.plan.trialDays > 0 ? this.addDays(now, session.plan.trialDays) : null;
        const status =
          session.plan.trialDays > 0
            ? OrganizationSubscriptionStatus.TRIALING
            : OrganizationSubscriptionStatus.ACTIVE;

        await this.prisma.$transaction(async (tx) => {
          const subscription = await tx.organizationSubscription.upsert({
            where: { organizationId: session.organizationId },
            create: {
              organizationId: session.organizationId,
              planId: session.planId,
              provider: BillingProvider.RAZORPAY,
              status,
              providerSubscriptionId: providerPaymentId,
              currentPeriodStart: now,
              currentPeriodEnd: periodEnd,
              trialStart: trialEnd ? now : null,
              trialEnd,
              canceledAt: null,
              createdByUserId: session.createdByUserId,
              metadata: {
                lastCheckoutSessionToken: session.token,
                source: 'razorpay:webhook',
              } as Prisma.InputJsonValue,
            },
            update: {
              planId: session.planId,
              provider: BillingProvider.RAZORPAY,
              status,
              providerSubscriptionId: providerPaymentId,
              currentPeriodStart: now,
              currentPeriodEnd: periodEnd,
              trialStart: trialEnd ? now : null,
              trialEnd,
              canceledAt: null,
              createdByUserId: session.createdByUserId,
              metadata: {
                lastCheckoutSessionToken: session.token,
                source: 'razorpay:webhook',
              } as Prisma.InputJsonValue,
            },
            include: {
              plan: true,
            },
          });

          await tx.subscriptionCheckoutSession.update({
            where: { id: session.id },
            data: {
              status: SubscriptionCheckoutStatus.COMPLETED,
              completedAt: now,
              providerSessionId: providerSessionId ?? session.providerSessionId,
            },
          });

          await tx.subscriptionEvent.createMany({
            data: [
              {
                organizationId: session.organizationId,
                checkoutSessionId: session.id,
                organizationSubscriptionId: subscription.id,
                type: SubscriptionEventType.CHECKOUT_COMPLETED,
                provider: BillingProvider.RAZORPAY,
                payload: {
                  sessionToken: session.token,
                  eventType,
                  completedAt: now.toISOString(),
                } as Prisma.InputJsonValue,
              },
              {
                organizationId: session.organizationId,
                checkoutSessionId: session.id,
                organizationSubscriptionId: subscription.id,
                type: SubscriptionEventType.SUBSCRIPTION_ACTIVATED,
                provider: BillingProvider.RAZORPAY,
                payload: {
                  status,
                  providerPaymentId,
                  trialEnd: trialEnd?.toISOString() ?? null,
                  currentPeriodEnd: periodEnd.toISOString(),
                } as Prisma.InputJsonValue,
              },
              {
                organizationId: session.organizationId,
                checkoutSessionId: session.id,
                organizationSubscriptionId: subscription.id,
                type: SubscriptionEventType.WEBHOOK_RECEIVED,
                provider: BillingProvider.RAZORPAY,
                payload: {
                  eventType,
                  providerSessionId,
                  providerPaymentId,
                } as Prisma.InputJsonValue,
              },
            ],
          });
        });
      }

      return {
        received: true,
        updated: true,
      };
    }

    await this.prisma.subscriptionEvent.create({
      data: {
        organizationId: session.organizationId,
        checkoutSessionId: session.id,
        type: SubscriptionEventType.WEBHOOK_RECEIVED,
        provider: BillingProvider.RAZORPAY,
        payload: {
          eventType,
          providerSessionId,
          providerPaymentId,
        } as Prisma.InputJsonValue,
      },
    });

    return {
      received: true,
      updated: false,
      ignored: true,
      eventType,
    };
  }

  async processWebhook(dto: SubscriptionWebhookDto) {
    const eventType = dto.eventType.trim().toLowerCase();

    const subscription = await this.findSubscriptionForWebhook(dto);
    if (!subscription) {
      return {
        received: true,
        updated: false,
        reason: 'No matching subscription found',
      };
    }

    const nextStatus = dto.status ?? this.mapStatusFromEventType(eventType);
    const now = new Date();

    const updatedSubscription = await this.prisma.organizationSubscription.update({
      where: { id: subscription.id },
      data: {
        ...(nextStatus ? { status: nextStatus } : {}),
        ...(nextStatus === OrganizationSubscriptionStatus.CANCELED
          ? { canceledAt: now }
          : {}),
        metadata: {
          ...(subscription.metadata && typeof subscription.metadata === 'object'
            ? (subscription.metadata as Record<string, unknown>)
            : {}),
          lastWebhookEventType: dto.eventType,
          lastWebhookAt: now.toISOString(),
        } as Prisma.InputJsonValue,
      },
      include: {
        plan: true,
      },
    });

    await this.prisma.subscriptionEvent.create({
      data: {
        organizationId: subscription.organizationId,
        organizationSubscriptionId: subscription.id,
        type: SubscriptionEventType.WEBHOOK_RECEIVED,
        provider: dto.provider,
        payload: {
          ...dto,
          mappedStatus: nextStatus,
        } as Prisma.InputJsonValue,
      },
    });

    return {
      received: true,
      updated: true,
      subscription: updatedSubscription,
    };
  }

  private async findSubscriptionForWebhook(dto: SubscriptionWebhookDto) {
    if (dto.providerSubscriptionId) {
      return this.prisma.organizationSubscription.findFirst({
        where: {
          provider: dto.provider,
          providerSubscriptionId: dto.providerSubscriptionId,
        },
      });
    }

    if (dto.organizationId) {
      return this.prisma.organizationSubscription.findUnique({
        where: {
          organizationId: dto.organizationId,
        },
      });
    }

    if (dto.providerSessionId) {
      const session = await this.prisma.subscriptionCheckoutSession.findFirst({
        where: {
          provider: dto.provider,
          providerSessionId: dto.providerSessionId,
        },
      });

      if (!session) {
        return null;
      }

      return this.prisma.organizationSubscription.findUnique({
        where: {
          organizationId: session.organizationId,
        },
      });
    }

    return null;
  }

  private asRecord(value: unknown): Record<string, unknown> | undefined {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return undefined;
    }

    return value as Record<string, unknown>;
  }

  private mapStatusFromEventType(eventType: string) {
    if (eventType.includes('canceled') || eventType.includes('cancelled')) {
      return OrganizationSubscriptionStatus.CANCELED;
    }

    if (eventType.includes('past_due')) {
      return OrganizationSubscriptionStatus.PAST_DUE;
    }

    if (eventType.includes('expired')) {
      return OrganizationSubscriptionStatus.EXPIRED;
    }

    if (eventType.includes('active') || eventType.includes('renewed')) {
      return OrganizationSubscriptionStatus.ACTIVE;
    }

    return undefined;
  }

  private assertManagerRole(role: Role | string) {
    if (!this.managerRoles.has(role as Role)) {
      throw new ForbiddenException('Insufficient role permission for subscription operation');
    }
  }

  private addDays(date: Date, days: number) {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
  }

  private addInterval(date: Date, interval: SubscriptionInterval) {
    const next = new Date(date);
    const monthsToAdd = interval === SubscriptionInterval.YEARLY ? 12 : 1;
    next.setMonth(next.getMonth() + monthsToAdd);
    return next;
  }
}
