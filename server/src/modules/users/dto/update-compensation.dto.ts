import { IsDateString, IsEnum, IsNumber, IsOptional } from 'class-validator';
import { Currency, PayFrequency } from '@prisma/client';

export class UpdateCompensationDto {
  @IsNumber()
  @IsOptional()
  salaryAmount?: number;

  @IsEnum(Currency)
  @IsOptional()
  salaryCurrency?: Currency;

  @IsEnum(PayFrequency)
  @IsOptional()
  payFrequency?: PayFrequency;

  @IsDateString()
  @IsOptional()
  effectiveDate?: string;
}
