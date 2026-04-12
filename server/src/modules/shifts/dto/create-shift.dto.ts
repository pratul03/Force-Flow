import { IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateShiftDto {
  @IsString()
  @IsNotEmpty()
  organizationId!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  startTime!: string;

  @IsString()
  @IsNotEmpty()
  endTime!: string;

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
}
