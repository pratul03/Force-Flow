import { IsArray, IsBoolean, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

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

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
