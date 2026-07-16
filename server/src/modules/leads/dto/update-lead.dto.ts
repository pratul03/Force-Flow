import { Currency, LeadStatus } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateLeadDto {
  @IsString()
  @IsOptional()
  actorUserId!: string;

  @IsString()
  @MaxLength(120)
  @IsOptional()
  name?: string;

  @IsString()
  @MaxLength(180)
  @IsOptional()
  company?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @MaxLength(40)
  @IsOptional()
  phone?: string;

  @IsString()
  @MaxLength(100)
  @IsOptional()
  source?: string;

  @IsString()
  @MaxLength(4000)
  @IsOptional()
  notes?: string;

  @IsEnum(LeadStatus)
  @IsOptional()
  status?: LeadStatus;

  @IsNumber()
  @Min(0)
  @IsOptional()
  expectedAmount?: number;

  @IsEnum(Currency)
  @IsOptional()
  currency?: Currency;
}
