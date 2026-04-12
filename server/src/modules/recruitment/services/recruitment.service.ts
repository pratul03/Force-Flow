import {
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import {
  Prisma,
  QueueJob,
  QueueJobStatus,
  RecruitmentStage,
} from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { QueueService } from '../../queue/services/queue.service';
import { CreateCandidateDto } from '../dto/create-candidate.dto';
import { RecruitmentCandidateQueryDto } from '../dto/recruitment-candidate-query.dto';
import { ScoreApplicationsDto } from '../dto/score-applications.dto';
import { UpdateCandidateStageDto } from '../dto/update-candidate-stage.dto';

@Injectable()
export class RecruitmentService implements OnModuleInit {
  constructor(
    private readonly queueService: QueueService,
    private readonly prisma: PrismaService,
  ) {}

  onModuleInit() {
    this.queueService.registerHandler('recruitment.score-applications', async (job: QueueJob) => {
      await this.processScoreApplications(job);
    });
  }

  async getStatus(organizationId?: string) {
    const where = organizationId ? { organizationId } : undefined;

    const [totalCandidates, stageCounts, queuedJobs] = await Promise.all([
      this.prisma.recruitmentCandidate.count({ where }),
      this.prisma.recruitmentCandidate.groupBy({
        by: ['stage'],
        where,
        _count: { _all: true },
      }),
      this.prisma.queueJob.count({
        where: {
          type: 'recruitment.score-applications',
          status: {
            in: [
              QueueJobStatus.PENDING,
              QueueJobStatus.RETRY,
              QueueJobStatus.PROCESSING,
            ],
          },
        },
      }),
    ]);

    return {
      module: 'recruitment',
      status: 'active',
      organizationId: organizationId ?? null,
      totalCandidates,
      stageCounts: stageCounts.map((item) => ({
        stage: item.stage,
        count: item._count._all,
      })),
      queuedJobs,
      generatedAt: new Date().toISOString(),
    };
  }

  listCandidates(query: RecruitmentCandidateQueryDto) {
    return this.prisma.recruitmentCandidate.findMany({
      where: {
        ...(query.organizationId ? { organizationId: query.organizationId } : {}),
        ...(query.stage ? { stage: query.stage } : {}),
      },
      orderBy: [{ score: 'desc' }, { createdAt: 'desc' }],
      take: query.limit ?? 100,
    });
  }

  async createCandidate(dto: CreateCandidateDto) {
    const org = await this.prisma.organization.findUnique({
      where: { id: dto.organizationId },
      select: { id: true },
    });

    if (!org) {
      throw new NotFoundException('Organization not found');
    }

    const candidate = await this.prisma.recruitmentCandidate.create({
      data: {
        organizationId: dto.organizationId,
        fullName: dto.fullName,
        email: dto.email.toLowerCase(),
        phone: dto.phone,
        source: dto.source,
        resumeUrl: dto.resumeUrl,
        totalExperienceYears: dto.totalExperienceYears ?? 0,
        expectedSalary: dto.expectedSalary,
        expectedCurrency: dto.expectedCurrency,
        notes: dto.notes,
      },
    });

    await this.queueService.enqueue({
      type: 'recruitment.score-applications',
      payload: {
        candidateId: candidate.id,
        organizationId: candidate.organizationId,
        trigger: 'candidate-created',
      },
      maxAttempts: 3,
    });

    return candidate;
  }

  async updateCandidateStage(candidateId: string, dto: UpdateCandidateStageDto) {
    const existing = await this.prisma.recruitmentCandidate.findUnique({
      where: { id: candidateId },
      select: { id: true, notes: true },
    });

    if (!existing) {
      throw new NotFoundException('Candidate not found');
    }

    return this.prisma.recruitmentCandidate.update({
      where: { id: candidateId },
      data: {
        stage: dto.stage,
        notes: dto.notes
          ? [existing.notes, dto.notes].filter(Boolean).join('\n')
          : existing.notes,
      },
    });
  }

  scoreApplications(dto: ScoreApplicationsDto = {}) {
    return this.queueService.enqueue({
      type: 'recruitment.score-applications',
      payload: {
        ...dto,
        trigger: 'manual',
      },
      maxAttempts: 5,
    });
  }

  private async processScoreApplications(job: QueueJob) {
    const payload = job.payload as Prisma.JsonObject;
    const candidateId = typeof payload.candidateId === 'string' ? payload.candidateId : null;
    const organizationId =
      typeof payload.organizationId === 'string' ? payload.organizationId : null;
    const limit =
      typeof payload.limit === 'number' && Number.isInteger(payload.limit)
        ? Math.max(1, Math.min(500, payload.limit))
        : 100;

    const candidates = await this.prisma.recruitmentCandidate.findMany({
      where: {
        ...(candidateId ? { id: candidateId } : {}),
        ...(organizationId ? { organizationId } : {}),
        stage: {
          notIn: [RecruitmentStage.REJECTED, RecruitmentStage.HIRED],
        },
      },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });

    await Promise.all(
      candidates.map((candidate) => {
        const breakdown = this.calculateCandidateScore({
          totalExperienceYears: candidate.totalExperienceYears,
          stage: candidate.stage,
          source: candidate.source,
          resumeUrl: candidate.resumeUrl,
        });

        return this.prisma.recruitmentCandidate.update({
          where: { id: candidate.id },
          data: {
            score: breakdown.total,
            scoreBreakdown: breakdown as Prisma.InputJsonValue,
            lastScoredAt: new Date(),
          },
        });
      }),
    );
  }

  private calculateCandidateScore(input: {
    totalExperienceYears: number;
    stage: RecruitmentStage;
    source: string | null;
    resumeUrl: string | null;
  }) {
    const experienceScore = Math.min(60, Math.round(input.totalExperienceYears * 8));
    const resumeScore = input.resumeUrl ? 10 : 0;

    const stageScoreMap: Record<RecruitmentStage, number> = {
      APPLIED: 4,
      SCREENING: 10,
      INTERVIEW: 16,
      OFFER: 22,
      HIRED: 28,
      REJECTED: 0,
    };

    const sourceScore = input.source
      ? ['referral', 'internal', 'campus'].includes(input.source.toLowerCase())
        ? 8
        : 4
      : 0;

    const stageScore = stageScoreMap[input.stage] ?? 0;
    const total = Math.min(100, experienceScore + resumeScore + sourceScore + stageScore);

    return {
      total,
      components: {
        experienceScore,
        resumeScore,
        sourceScore,
        stageScore,
      },
    };
  }
}
