import { RecruitmentStage } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateCandidateStageDto {
  @IsEnum(RecruitmentStage)
  stage!: RecruitmentStage;

  @IsString()
  @IsOptional()
  notes?: string;
}
