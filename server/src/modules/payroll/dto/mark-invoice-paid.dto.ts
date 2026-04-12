import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class MarkInvoicePaidDto {
  @IsString()
  @IsNotEmpty()
  actorUserId!: string;

  @IsString()
  @IsOptional()
  paymentReference?: string;
}
