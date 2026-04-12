import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../../../common/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/auth/guards/roles.guard';
import { Roles } from '../../../common/auth/roles.decorator';
import { RecruitmentService } from '../services/recruitment.service';
import { CreateCandidateDto } from '../dto/create-candidate.dto';
import { RecruitmentCandidateQueryDto } from '../dto/recruitment-candidate-query.dto';
import { ScoreApplicationsDto } from '../dto/score-applications.dto';
import { UpdateCandidateStageDto } from '../dto/update-candidate-stage.dto';

@Controller('recruitment')
export class RecruitmentController {
  constructor(private readonly recruitmentService: RecruitmentService) {}

  @Get('status')
  status(@Query('organizationId') organizationId?: string) {
    return this.recruitmentService.getStatus(organizationId);
  }

  @Get('candidates')
  listCandidates(@Query() query: RecruitmentCandidateQueryDto) {
    return this.recruitmentService.listCandidates(query);
  }

  @Post('candidates')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.HR_MANAGER)
  createCandidate(@Body() dto: CreateCandidateDto) {
    return this.recruitmentService.createCandidate(dto);
  }

  @Patch('candidates/:id/stage')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.HR_MANAGER)
  updateCandidateStage(
    @Param('id') id: string,
    @Body() dto: UpdateCandidateStageDto,
  ) {
    return this.recruitmentService.updateCandidateStage(id, dto);
  }

  @Post('score-applications')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.HR_MANAGER)
  scoreApplications(@Body() dto: ScoreApplicationsDto) {
    return this.recruitmentService.scoreApplications(dto);
  }
}
