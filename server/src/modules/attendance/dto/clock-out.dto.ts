import { IsDateString, IsOptional, IsString, IsNumber } from 'class-validator';

export class ClockOutDto {
  @IsString()
  userId!: string;

  @IsDateString()
  @IsOptional()
  clockOut?: string;

  @IsNumber()
  @IsOptional()
  latitude?: number;

  @IsNumber()
  @IsOptional()
  longitude?: number;

  @IsString()
  @IsOptional()
  photoUrl?: string;
}
