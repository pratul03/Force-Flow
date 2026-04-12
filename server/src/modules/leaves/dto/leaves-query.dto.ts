import { LeaveStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class LeavesQueryDto {
  @IsString()
  @IsOptional()
  userId?: string;

  @IsString()
  @IsOptional()
  approverId?: string;

  @IsEnum(LeaveStatus)
  @IsOptional()
  status?: LeaveStatus;
}
