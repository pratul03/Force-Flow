import { IsNumber, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class QuotationLineItemDto {
  @IsString()
  @MaxLength(180)
  title!: string;

  @IsString()
  @MaxLength(2000)
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0.01)
  quantity!: number;

  @IsNumber()
  @Min(0)
  unitPrice!: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  taxPercent?: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  @IsOptional()
  discountPercent?: number;
}
