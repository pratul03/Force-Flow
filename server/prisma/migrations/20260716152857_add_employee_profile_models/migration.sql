-- CreateEnum
CREATE TYPE "PayFrequency" AS ENUM ('HOURLY', 'MONTHLY', 'YEARLY');

-- CreateTable
CREATE TABLE "UserBankDetails" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "swiftCode" TEXT,
    "routingNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserBankDetails_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserCompensation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "salaryAmount" DOUBLE PRECISION NOT NULL,
    "salaryCurrency" "Currency" NOT NULL,
    "payFrequency" "PayFrequency" NOT NULL,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserCompensation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserBankDetails_userId_key" ON "UserBankDetails"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserCompensation_userId_key" ON "UserCompensation"("userId");

-- AddForeignKey
ALTER TABLE "UserBankDetails" ADD CONSTRAINT "UserBankDetails_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserCompensation" ADD CONSTRAINT "UserCompensation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
