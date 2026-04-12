import { IsNotEmpty, IsObject, IsOptional, IsString } from 'class-validator';

export class ScheduleJobDto {
  @IsString()
  @IsNotEmpty()
  type!: string;

  @IsObject()
  @IsOptional()
  payload?: Record<string, unknown>;
}
