import {
  BillingProvider,
  OrganizationSubscriptionStatus,
} from '@prisma/client';
import { IsEnum, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class SubscriptionWebhookDto {
  @IsString()
  @MaxLength(80)
  eventType!: string;

  @IsEnum(BillingProvider)
  provider!: BillingProvider;

  @IsString()
  @IsOptional()
  providerSessionId?: string;

  @IsString()
  @IsOptional()
  providerSubscriptionId?: string;

  @IsString()
  @IsOptional()
  organizationId?: string;

  @IsEnum(OrganizationSubscriptionStatus)
  @IsOptional()
  status?: OrganizationSubscriptionStatus;

  @IsObject()
  @IsOptional()
  payload?: Record<string, unknown>;
}
