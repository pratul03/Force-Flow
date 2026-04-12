import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class RunDepreciationDto {
  @IsString()
  @IsOptional()
  organizationId?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  @IsOptional()
  limit?: number;

  @IsDateString()
  @IsOptional()
  asOfDate?: string;
}
