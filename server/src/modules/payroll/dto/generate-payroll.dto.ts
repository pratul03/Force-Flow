import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class GeneratePayrollDto {
  @IsInt()
  @Min(1)
  @Max(12)
  month!: number;

  @IsInt()
  @Min(2000)
  @Max(3000)
  year!: number;

  @IsString()
  @IsOptional()
  organizationId?: string;
}
