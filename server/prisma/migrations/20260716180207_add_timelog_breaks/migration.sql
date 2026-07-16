-- CreateTable
CREATE TABLE "TimeLogBreak" (
    "id" TEXT NOT NULL,
    "timeLogId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TimeLogBreak_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TimeLogBreak_timeLogId_idx" ON "TimeLogBreak"("timeLogId");

-- AddForeignKey
ALTER TABLE "TimeLogBreak" ADD CONSTRAINT "TimeLogBreak_timeLogId_fkey" FOREIGN KEY ("timeLogId") REFERENCES "TimeLog"("id") ON DELETE CASCADE ON UPDATE CASCADE;
