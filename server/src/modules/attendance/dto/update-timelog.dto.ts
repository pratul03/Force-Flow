import { IsDateString, IsOptional, IsString } from 'class-validator';

export class UpdateTimelogDto {
  @IsDateString()
  @IsOptional()
  clockIn?: string;

  @IsDateString()
  @IsOptional()
  clockOut?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
