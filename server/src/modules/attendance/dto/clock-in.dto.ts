import { IsDateString, IsString } from 'class-validator';

export class ClockInDto {
  @IsString()
  userId!: string;

  @IsDateString()
  clockIn!: string;
}
