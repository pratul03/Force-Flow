import { IsDateString, IsOptional, IsString, IsNumber } from 'class-validator';

export class ClockInDto {
  @IsString()
  userId!: string;

  @IsDateString()
  clockIn!: string;

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
