import { PerformanceReviewStatus } from '@prisma/client';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class UpsertPerformanceReviewDto {
  @IsString()
  @IsNotEmpty()
  organizationId!: string;

  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsString()
  @IsOptional()
  reviewerId?: string;

  @IsNumber()
  @Min(1)
  @Max(12)
  cycleMonth!: number;

  @IsNumber()
  @Min(2000)
  @Max(3000)
  cycleYear!: number;

  @IsNumber()
  @Min(0)
  @Max(5)
  @IsOptional()
  score?: number;

  @IsEnum(PerformanceReviewStatus)
  @IsOptional()
  status?: PerformanceReviewStatus;

  @IsString()
  @IsOptional()
  summary?: string;

  @IsString()
  @IsOptional()
  strengths?: string;

  @IsString()
  @IsOptional()
  improvements?: string;

  @IsArray()
  @IsOptional()
  goals?: string[];
}
