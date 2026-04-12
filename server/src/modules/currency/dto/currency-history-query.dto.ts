import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

export class CurrencyHistoryQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  limit?: number;
}
