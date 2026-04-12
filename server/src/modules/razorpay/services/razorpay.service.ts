import { BadRequestException, Injectable } from '@nestjs/common';
import { BillingProvider, SubscriptionInterval } from '@prisma/client';
import { createHmac, timingSafeEqual } from 'crypto';
import Razorpay from 'razorpay';

type CreateRazorpayCheckoutInput = {
  organizationId: string;
  planId: string;
  planCode: string;
  planName: string;
  planDescription?: string | null;
  interval: SubscriptionInterval;
  price: number;
  currency: string;
  trialDays: number;
  sessionToken: string;
  successUrl: string;
  cancelUrl: string;
};

@Injectable()
export class RazorpayService {
  private razorpayClient?: Razorpay;

  private getClient() {
    if (this.razorpayClient) {
      return this.razorpayClient;
    }

    const keyId = process.env.RAZORPAY_KEY_ID ?? 'rzp_test_dummy_replace_me';
    const keySecret =
      process.env.RAZORPAY_KEY_SECRET ?? 'rzp_test_dummy_secret_replace_me';

    this.razorpayClient = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    return this.razorpayClient;
  }

  createPayout(payload: Record<string, unknown>) {
    return {
      provider: BillingProvider.RAZORPAY,
      status: 'queued',
      payload,
      createdAt: new Date().toISOString(),
    };
  }

  async createCheckoutSession(input: CreateRazorpayCheckoutInput) {
    const client = this.getClient();
    const amountInSubunits = Math.round(input.price * 100);

    if (amountInSubunits <= 0) {
      throw new BadRequestException('Plan price must be greater than zero');
    }

    const callbackUrl = this.appendSessionToken(input.successUrl, input.sessionToken);
    const expireBy = Math.floor(Date.now() / 1000) + 30 * 60;

    const paymentLink = await new Promise<Record<string, unknown>>(
      (resolve, reject) => {
        client.paymentLink.create(
          {
            amount: amountInSubunits,
            currency: input.currency.toUpperCase(),
            accept_partial: false,
            description: input.planDescription ?? `${input.planName} subscription`,
            reference_id: `${input.organizationId}:${input.planCode}:${Date.now()}`,
            callback_url: callbackUrl,
            callback_method: 'get',
            expire_by: expireBy,
            notes: {
              organizationId: input.organizationId,
              planId: input.planId,
              planCode: input.planCode,
              sessionToken: input.sessionToken,
              interval: input.interval,
              trialDays: String(input.trialDays),
            },
          } as never,
          (error: unknown, response: unknown) => {
            if (error) {
              reject(error);
              return;
            }

            resolve((response ?? {}) as Record<string, unknown>);
          },
        );
      },
    );

    const shortUrl =
      typeof paymentLink.short_url === 'string' ? paymentLink.short_url : undefined;
    const paymentLinkId =
      typeof paymentLink.id === 'string' ? paymentLink.id : undefined;
    const expireByValue =
      typeof paymentLink.expire_by === 'number' ? paymentLink.expire_by : undefined;

    if (!shortUrl || !paymentLinkId) {
      throw new BadRequestException('Razorpay checkout URL was not created');
    }

    return {
      provider: BillingProvider.RAZORPAY,
      providerSessionId: paymentLinkId,
      checkoutUrl: shortUrl,
      expiresAt: expireByValue
        ? new Date(expireByValue * 1000)
        : new Date(Date.now() + 30 * 60 * 1000),
    };
  }

  verifyWebhookSignature(rawBody: Buffer | string, signature: string) {
    const webhookSecret =
      process.env.RAZORPAY_WEBHOOK_SECRET ?? 'razorpay_webhook_dummy_replace_me';
    const payload = typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8');

    if (!payload) {
      throw new BadRequestException('Razorpay webhook payload is empty');
    }

    if (!signature) {
      throw new BadRequestException('Missing Razorpay signature header');
    }

    const digest = createHmac('sha256', webhookSecret).update(payload).digest('hex');
    const digestBuffer = Buffer.from(digest);
    const signatureBuffer = Buffer.from(signature);

    if (
      digestBuffer.length !== signatureBuffer.length ||
      !timingSafeEqual(digestBuffer, signatureBuffer)
    ) {
      throw new BadRequestException('Invalid Razorpay webhook signature');
    }
  }

  private appendSessionToken(url: string, sessionToken: string) {
    const nextUrl = new URL(url);
    if (!nextUrl.searchParams.has('sessionToken')) {
      nextUrl.searchParams.set('sessionToken', sessionToken);
    }
    return nextUrl.toString();
  }
}
