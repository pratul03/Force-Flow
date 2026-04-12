import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';

export class CompensationPreviewDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month!: number;

  @Type(() => Number)
  @IsInt()
  @Min(2000)
  @Max(3000)
  year!: number;
}
