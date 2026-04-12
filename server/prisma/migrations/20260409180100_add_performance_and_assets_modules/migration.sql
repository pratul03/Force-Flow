-- CreateEnum
CREATE TYPE "PerformanceReviewStatus" AS ENUM ('DRAFT', 'PENDING_REVIEWER', 'FINALIZED');

-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('AVAILABLE', 'ASSIGNED', 'UNDER_MAINTENANCE', 'RETIRED', 'LOST');

-- CreateTable
CREATE TABLE "PerformanceReview" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reviewerId" TEXT,
    "cycleMonth" INTEGER NOT NULL,
    "cycleYear" INTEGER NOT NULL,
    "score" DOUBLE PRECISION,
    "status" "PerformanceReviewStatus" NOT NULL DEFAULT 'DRAFT',
    "summary" TEXT,
    "strengths" TEXT,
    "improvements" TEXT,
    "goals" JSONB,
    "generatedByJob" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PerformanceReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Asset" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "assetCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" "AssetStatus" NOT NULL DEFAULT 'AVAILABLE',
    "assignedToUserId" TEXT,
    "purchaseDate" TIMESTAMP(3) NOT NULL,
    "purchaseCost" DOUBLE PRECISION NOT NULL,
    "salvageValue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "usefulLifeMonths" INTEGER NOT NULL DEFAULT 36,
    "accumulatedDepreciation" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "netBookValue" DOUBLE PRECISION NOT NULL,
    "lastDepreciationAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Asset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PerformanceReview_organizationId_cycleYear_cycleMonth_idx" ON "PerformanceReview"("organizationId", "cycleYear", "cycleMonth");

-- CreateIndex
CREATE INDEX "PerformanceReview_userId_idx" ON "PerformanceReview"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PerformanceReview_organizationId_userId_cycleMonth_cycleYea_key" ON "PerformanceReview"("organizationId", "userId", "cycleMonth", "cycleYear");

-- CreateIndex
CREATE INDEX "Asset_organizationId_status_idx" ON "Asset"("organizationId", "status");

-- CreateIndex
CREATE INDEX "Asset_assignedToUserId_idx" ON "Asset"("assignedToUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Asset_organizationId_assetCode_key" ON "Asset"("organizationId", "assetCode");

-- AddForeignKey
ALTER TABLE "PerformanceReview" ADD CONSTRAINT "PerformanceReview_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asset" ADD CONSTRAINT "Asset_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
