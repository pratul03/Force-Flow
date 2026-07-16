import { Currency } from '@prisma/client';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Min,
} from 'class-validator';

export class CreateCandidateDto {
  @IsString()
  @IsOptional()
  organizationId!: string;

  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @IsString()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  source?: string;

  @IsUrl()
  @IsOptional()
  resumeUrl?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  totalExperienceYears?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  expectedSalary?: number;

  @IsEnum(Currency)
  @IsOptional()
  expectedCurrency?: Currency;

  @IsString()
  @IsOptional()
  notes?: string;
}
