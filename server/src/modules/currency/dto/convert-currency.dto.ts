import { Currency } from '@prisma/client';
import { IsEnum, IsNumber, IsObject, IsOptional, Min } from 'class-validator';

export class ConvertCurrencyDto {
  @IsNumber()
  @Min(0)
  amount!: number;

  @IsEnum(Currency)
  from!: Currency;

  @IsEnum(Currency)
  to!: Currency;

  @IsObject()
  @IsOptional()
  context?: Record<string, unknown>;
}
