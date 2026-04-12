import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class SyncHolidaysDto {
  @IsString()
  @IsOptional()
  organizationId?: string;

  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(3000)
  @IsOptional()
  year?: number;

  @IsString()
  @IsOptional()
  country?: string;
}
