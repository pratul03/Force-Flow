import { RecruitmentStage } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class RecruitmentCandidateQueryDto {
  @IsString()
  @IsOptional()
  organizationId?: string;

  @IsEnum(RecruitmentStage)
  @IsOptional()
  stage?: RecruitmentStage;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  @IsOptional()
  limit?: number;
}
