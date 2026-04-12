import { BillingProvider } from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';

export class CreateCheckoutSessionDto {
  @IsString()
  @MaxLength(80)
  planCode!: string;

  @IsEnum(BillingProvider)
  @IsOptional()
  provider?: BillingProvider;

  @IsUrl({ require_tld: false }, { message: 'successUrl must be a valid URL' })
  @IsOptional()
  successUrl?: string;

  @IsUrl({ require_tld: false }, { message: 'cancelUrl must be a valid URL' })
  @IsOptional()
  cancelUrl?: string;
}
