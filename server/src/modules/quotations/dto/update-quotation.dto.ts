import { Currency } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { QuotationDesignerDto } from './quotation-designer.dto';
import { QuotationLineItemDto } from './quotation-line-item.dto';

export class UpdateQuotationDto {
  @IsString()
  @IsOptional()
  actorUserId!: string;

  @IsString()
  @MaxLength(180)
  @IsOptional()
  title?: string;

  @IsString()
  @MaxLength(4000)
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  amount?: number;

  @IsEnum(Currency)
  @IsOptional()
  currency?: Currency;

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

  @IsDateString()
  @IsOptional()
  validUntil?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuotationLineItemDto)
  @IsOptional()
  lineItems?: QuotationLineItemDto[];

  @ValidateNested()
  @Type(() => QuotationDesignerDto)
  @IsOptional()
  designer?: QuotationDesignerDto;
}
