import { IsOptional, IsString } from 'class-validator';

export class StartBreakDto {
  @IsString()
  @IsOptional()
  reason?: string;
}
