import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
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
@UseGuards(JwtAuthGuard)
export class RecruitmentController {
  constructor(private readonly recruitmentService: RecruitmentService) {}

  @Get('status')
  status(@Req() req: { user: { organizationId: string } }) {
    return this.recruitmentService.getStatus(req.user.organizationId);
  }

  @Get('candidates')
  listCandidates(
    @Query() query: RecruitmentCandidateQueryDto,
    @Req() req: { user: { organizationId: string } },
  ) {
    return this.recruitmentService.listCandidates({
      ...query,
      organizationId: req.user.organizationId,
    });
  }

  @Post('candidates')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.HR_MANAGER)
  createCandidate(@Body() dto: CreateCandidateDto, @Req() req: { user: { organizationId: string } }) {
    return this.recruitmentService.createCandidate({
      ...dto,
      organizationId: req.user.organizationId,
    });
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
  scoreApplications(
    @Body() dto: ScoreApplicationsDto,
    @Req() req: { user: { organizationId: string } },
  ) {
    return this.recruitmentService.scoreApplications({
      ...dto,
      organizationId: req.user.organizationId,
    });
  }
}
