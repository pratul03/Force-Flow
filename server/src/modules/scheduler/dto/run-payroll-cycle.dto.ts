import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class RunPayrollCycleDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  @IsOptional()
  month?: number;

  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(3000)
  @IsOptional()
  year?: number;

  @IsString()
  @IsOptional()
  organizationId?: string;
}
