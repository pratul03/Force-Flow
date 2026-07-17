import { IsArray, IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateShiftDto {
  @IsString()
  @IsOptional()
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
  @IsOptional()
  gracePeriodMins?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  halfDayMarkMins?: number;

  @IsArray()
  @IsInt({ each: true })
  @IsOptional()
  workingDays?: number[];

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}
