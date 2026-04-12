import { AssetStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class AssignAssetDto {
  @IsString()
  @IsOptional()
  assignedToUserId?: string;

  @IsEnum(AssetStatus)
  @IsOptional()
  status?: AssetStatus;

  @IsString()
  @IsOptional()
  notes?: string;
}
