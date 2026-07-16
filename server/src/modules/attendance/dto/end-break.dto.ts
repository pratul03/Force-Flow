import { IsOptional, IsString } from 'class-validator';

export class EndBreakDto {
  @IsString()
  @IsOptional()
  reason?: string;
}
