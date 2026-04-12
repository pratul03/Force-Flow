-- CreateEnum
CREATE TYPE "RecruitmentStage" AS ENUM ('APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'HIRED', 'REJECTED');

-- CreateTable
CREATE TABLE "RecruitmentCandidate" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "source" TEXT,
    "resumeUrl" TEXT,
    "totalExperienceYears" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "expectedSalary" DOUBLE PRECISION,
    "expectedCurrency" "Currency" NOT NULL DEFAULT 'INR',
    "stage" "RecruitmentStage" NOT NULL DEFAULT 'APPLIED',
    "score" DOUBLE PRECISION,
    "scoreBreakdown" JSONB,
    "notes" TEXT,
    "lastScoredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecruitmentCandidate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RecruitmentCandidate_organizationId_stage_idx" ON "RecruitmentCandidate"("organizationId", "stage");

-- CreateIndex
CREATE INDEX "RecruitmentCandidate_score_idx" ON "RecruitmentCandidate"("score");

-- CreateIndex
CREATE UNIQUE INDEX "RecruitmentCandidate_organizationId_email_key" ON "RecruitmentCandidate"("organizationId", "email");

-- AddForeignKey
ALTER TABLE "RecruitmentCandidate" ADD CONSTRAINT "RecruitmentCandidate_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
