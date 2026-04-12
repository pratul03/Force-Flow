import { TimeLogStatus } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class UpdateTimelogDto {
  @IsDateString()
  @IsOptional()
  clockOut?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  totalHours?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  overtimeHours?: number;

  @IsEnum(TimeLogStatus)
  @IsOptional()
  status?: TimeLogStatus;

  @IsString()
  @IsOptional()
  notes?: string;
}
