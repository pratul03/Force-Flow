import { IsDateString, IsOptional, IsString } from 'class-validator';

export class ClockOutDto {
  @IsString()
  userId!: string;

  @IsDateString()
  @IsOptional()
  clockOut?: string;
}
