import { LeaveStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateLeaveDto {
  @IsEnum(LeaveStatus)
  @IsOptional()
  status?: LeaveStatus;

  @IsString()
  @IsOptional()
  reason?: string;

  @IsString()
  @IsOptional()
  rejectionReason?: string;
}
