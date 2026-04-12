import { LeaveStatus, LeaveType } from '@prisma/client';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateLeaveDto {
  @IsString()
  userId!: string;

  @IsEnum(LeaveType)
  leaveType!: LeaveType;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  endDate!: string;

  @IsNumber()
  @Min(0.5)
  @IsOptional()
  totalDays?: number;

  @IsString()
  reason!: string;

  @IsString()
  @IsOptional()
  appliedToId?: string;

  @IsBoolean()
  @IsOptional()
  isHalfDay?: boolean;

  @IsEnum(LeaveStatus)
  @IsOptional()
  status?: LeaveStatus;
}
