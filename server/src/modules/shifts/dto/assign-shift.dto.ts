import { IsDateString, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class AssignShiftDto {
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsString()
  @IsNotEmpty()
  shiftId!: string;

  @IsDateString()
  effectiveFrom!: string;

  @IsDateString()
  @IsOptional()
  effectiveUntil?: string;
}
