/// <reference types="jest" />

import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Role, UserStatus } from '@prisma/client';
import { QueueService } from '../src/modules/queue/services/queue.service';
import { RecruitmentService } from '../src/modules/recruitment/services/recruitment.service';
import { PerformanceService } from '../src/modules/performance/services/performance.service';
import { AssetsService } from '../src/modules/assets/services/assets.service';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Idempotency Flows (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let queueService: QueueService;
  let recruitmentService: RecruitmentService;
  let performanceService: PerformanceService;
  let assetsService: AssetsService;
  let db: any;

  const createdOrganizationIds: string[] = [];
  const createdUserIds: string[] = [];

  beforeAll(async () => {
    const { AppModule } = require('../src/app.module');

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);
    db = prisma as any;
    queueService = app.get(QueueService);
    recruitmentService = app.get(RecruitmentService);
    performanceService = app.get(PerformanceService);
    assetsService = app.get(AssetsService);
  });

  afterEach(async () => {
    await cleanupTestData();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }

    if (prisma) {
      await prisma.$disconnect();
    }
  });

  it('recruitment scoring remains idempotent across repeated runs', async () => {
    const org = await createOrganization('Recruitment Idempotency Org');

    const candidate = await recruitmentService.createCandidate({
      organizationId: org.id,
      fullName: 'Candidate One',
      email: `candidate.one.${Date.now()}@example.com`,
      source: 'referral',
      totalExperienceYears: 5,
    });

    await drainQueue();

    const first = await db.recruitmentCandidate.findUniqueOrThrow({
      where: { id: candidate.id },
    });

    await recruitmentService.scoreApplications({
      candidateId: candidate.id,
      organizationId: org.id,
    });

    await drainQueue();

    const second = await db.recruitmentCandidate.findUniqueOrThrow({
      where: { id: candidate.id },
    });

    expect(first.score).toBeDefined();
    expect(second.score).toBe(first.score);

    const candidateCount = await db.recruitmentCandidate.count({
      where: { organizationId: org.id },
    });
    expect(candidateCount).toBe(1);
  });

  it('performance review cycle generation is unique per user and cycle', async () => {
    const org = await createOrganization('Performance Idempotency Org');
    const user = await createUser(org.id, 'perf');

    await performanceService.generateReviewCycle({
      organizationId: org.id,
      month: 3,
      year: 2026,
    });
    await drainQueue();

    await performanceService.generateReviewCycle({
      organizationId: org.id,
      month: 3,
      year: 2026,
    });
    await drainQueue();

    const reviews = await db.performanceReview.findMany({
      where: {
        organizationId: org.id,
        userId: user.id,
        cycleMonth: 3,
        cycleYear: 2026,
      },
    });

    expect(reviews).toHaveLength(1);
  });

  it('asset depreciation remains idempotent in the same month', async () => {
    const org = await createOrganization('Asset Idempotency Org');

    const asset = await assetsService.createAsset({
      organizationId: org.id,
      assetCode: `AST-${Date.now()}`,
      name: 'Laptop 15',
      category: 'IT',
      status: 'AVAILABLE' as any,
      purchaseDate: '2025-01-15T00:00:00.000Z',
      purchaseCost: 120000,
      salvageValue: 20000,
      usefulLifeMonths: 36,
    });

    await assetsService.runDepreciation({
      organizationId: org.id,
      asOfDate: '2026-04-10T00:00:00.000Z',
      limit: 50,
    });
    await drainQueue();

    const first = await db.asset.findUniqueOrThrow({ where: { id: asset.id } });

    await assetsService.runDepreciation({
      organizationId: org.id,
      asOfDate: '2026-04-25T00:00:00.000Z',
      limit: 50,
    });
    await drainQueue();

    const second = await db.asset.findUniqueOrThrow({ where: { id: asset.id } });

    expect(second.accumulatedDepreciation).toBe(first.accumulatedDepreciation);
    expect(second.netBookValue).toBe(first.netBookValue);
  });

  async function drainQueue(maxRounds = 20) {
    for (let i = 0; i < maxRounds; i += 1) {
      const result = await queueService.processDueJobs('e2e-worker', 100);
      if (result.processed === 0) {
        break;
      }
    }
  }

  async function createOrganization(name: string) {
    const organization = await prisma.organization.create({
      data: {
        name,
        country: 'India',
        timezone: 'Asia/Kolkata',
      },
    });

    createdOrganizationIds.push(organization.id);
    return organization;
  }

  async function createUser(organizationId: string, seed: string) {
    const unique = Date.now();
    const user = await prisma.user.create({
      data: {
        email: `${seed}.${unique}@example.com`,
        password: 'hashed-password',
        firstName: 'Test',
        lastName: 'User',
        employeeId: `${seed.toUpperCase()}-${unique}`,
        organizationId,
        joiningDate: new Date('2025-01-01T00:00:00.000Z'),
        role: Role.EMPLOYEE,
        status: UserStatus.ACTIVE,
      },
    });

    createdUserIds.push(user.id);
    return user;
  }

  async function cleanupTestData() {
    if (createdOrganizationIds.length === 0) {
      return;
    }

    await prisma.queueJob.deleteMany({
      where: {
        type: {
          in: [
            'recruitment.score-applications',
            'performance.generate-review-cycle',
            'assets.run-depreciation',
            'notification.send',
          ],
        },
      },
    });

    await db.performanceReview.deleteMany({
      where: {
        organizationId: { in: createdOrganizationIds },
      },
    });

    await db.recruitmentCandidate.deleteMany({
      where: {
        organizationId: { in: createdOrganizationIds },
      },
    });

    await db.asset.deleteMany({
      where: {
        organizationId: { in: createdOrganizationIds },
      },
    });

    if (createdUserIds.length > 0) {
      await prisma.user.deleteMany({
        where: { id: { in: createdUserIds } },
      });
    }

    await prisma.organization.deleteMany({
      where: {
        id: { in: createdOrganizationIds },
      },
    });

    createdOrganizationIds.length = 0;
    createdUserIds.length = 0;
  }
});
