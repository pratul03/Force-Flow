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

export class CreateLeadDto {
  @IsString()
  organizationId!: string;

  @IsString()
  actorUserId!: string;

  @IsString()
  @MaxLength(120)
  name!: string;

  @IsString()
  @MaxLength(180)
  company!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @IsOptional()
  @MaxLength(40)
  phone?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  source?: string;

  @IsString()
  @IsOptional()
  @MaxLength(4000)
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
