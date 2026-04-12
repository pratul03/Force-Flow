import { QueueJobStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';

export class QueueJobsQueryDto {
  @IsEnum(QueueJobStatus)
  @IsOptional()
  status?: QueueJobStatus;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number;
}
