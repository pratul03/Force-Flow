import { IsEnum, IsOptional, IsString } from 'class-validator';
import { TimeLogStatus } from '@prisma/client';

export class UpdateTimeLogStatusDto {
  @IsEnum(TimeLogStatus)
  status!: TimeLogStatus;

  @IsString()
  @IsOptional()
  notes?: string;
}
