import { IsOptional, IsString } from 'class-validator';

export class SyncRatesDto {
  @IsString()
  @IsOptional()
  source?: string;
}
