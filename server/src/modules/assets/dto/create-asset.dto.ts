import { AssetStatus } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateAssetDto {
  @IsString()
  @IsNotEmpty()
  organizationId!: string;

  @IsString()
  @IsNotEmpty()
  assetCode!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  category!: string;

  @IsEnum(AssetStatus)
  @IsOptional()
  status?: AssetStatus;

  @IsString()
  @IsOptional()
  assignedToUserId?: string;

  @IsDateString()
  purchaseDate!: string;

  @IsNumber()
  @Min(0)
  purchaseCost!: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  salvageValue?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  usefulLifeMonths?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
