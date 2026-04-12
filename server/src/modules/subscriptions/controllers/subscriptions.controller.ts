import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../../common/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/auth/guards/roles.guard';
import { Roles } from '../../../common/auth/roles.decorator';
import { RazorpayService } from '../../razorpay/services/razorpay.service';
import { CreateCheckoutSessionDto } from '../dto/create-checkout-session.dto';
import { SubscriptionWebhookDto } from '../dto/subscription-webhook.dto';
import { SubscriptionsService } from '../services/subscriptions.service';

type AuthenticatedRequest = {
  user: {
    sub: string;
    organizationId: string;
    role: Role | string;
  };
};

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly razorpayService: RazorpayService,
  ) {}

  @Get('plans')
  listPlans() {
    return this.subscriptionsService.listPlans();
  }

  @Get('current')
  @UseGuards(JwtAuthGuard)
  currentSubscription(@Req() req: AuthenticatedRequest) {
    return this.subscriptionsService.getCurrentSubscription(req.user);
  }

  @Post('checkout-sessions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.HR_MANAGER, Role.MANAGER)
  createCheckoutSession(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateCheckoutSessionDto,
  ) {
    return this.subscriptionsService.createCheckoutSession(req.user, dto);
  }

  @Post('checkout-sessions/:token/complete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.HR_MANAGER, Role.MANAGER)
  completeCheckoutSession(
    @Req() req: AuthenticatedRequest,
    @Param('token') token: string,
  ) {
    return this.subscriptionsService.completeCheckoutSession(req.user, token);
  }

  @Post('webhook')
  webhook(@Body() dto: SubscriptionWebhookDto) {
    return this.subscriptionsService.processWebhook(dto);
  }

  @Post('webhook/razorpay')
  @HttpCode(200)
  razorpayWebhook(
    @Req() req: { rawBody?: Buffer; body: Record<string, unknown> },
    @Headers('x-razorpay-signature') signature: string,
    @Body() body: Record<string, unknown>,
  ) {
    this.razorpayService.verifyWebhookSignature(
      req.rawBody ?? JSON.stringify(body),
      signature,
    );

    return this.subscriptionsService.processRazorpayWebhook(body);
  }
}
