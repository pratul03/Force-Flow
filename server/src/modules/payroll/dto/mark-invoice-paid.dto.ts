import { IsOptional, IsString } from 'class-validator';

export class MarkInvoicePaidDto {
  @IsString()
  @IsOptional()
  actorUserId!: string;

  @IsString()
  @IsOptional()
  paymentReference?: string;
}
