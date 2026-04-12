import { Currency } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateOrganizationDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  country?: string;

  @IsEnum(Currency)
  @IsOptional()
  currency?: Currency;

  @IsString()
  @IsOptional()
  timezone?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  baseHourlyRate?: number;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  overtimeMultiplier?: number;
}
