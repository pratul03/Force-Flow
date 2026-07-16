import { IsOptional, IsString } from 'class-validator';

export class UpdateBankDetailsDto {
  @IsString()
  @IsOptional()
  accountName?: string;

  @IsString()
  @IsOptional()
  accountNumber?: string;

  @IsString()
  @IsOptional()
  bankName?: string;

  @IsString()
  @IsOptional()
  swiftCode?: string;

  @IsString()
  @IsOptional()
  routingNumber?: string;
}
