import { IsBoolean, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateShiftDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  startTime?: string;

  @IsString()
  @IsOptional()
  endTime?: string;

  @IsInt()
  @Min(0)
  @Max(120)
  @IsOptional()
  graceTimeMinutes?: number;

  @IsInt()
  @Min(0)
  @Max(240)
  @IsOptional()
  breakDurationMinutes?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
