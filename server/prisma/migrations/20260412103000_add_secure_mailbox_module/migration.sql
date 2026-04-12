-- CreateEnum
CREATE TYPE "MailProvider" AS ENUM ('GMAIL', 'OUTLOOK');

-- CreateTable
CREATE TABLE "MailConnection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "MailProvider" NOT NULL,
    "accountEmail" TEXT NOT NULL,
    "accessTokenEnc" TEXT NOT NULL,
    "refreshTokenEnc" TEXT,
    "tokenType" TEXT,
    "expiresAt" TIMESTAMP(3),
    "scopes" TEXT,
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MailConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MailOAuthSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" "MailProvider" NOT NULL,
    "state" TEXT NOT NULL,
    "codeVerifier" TEXT NOT NULL,
    "redirectUri" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MailOAuthSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MailConnection_userId_provider_key" ON "MailConnection"("userId", "provider");

-- CreateIndex
CREATE INDEX "MailConnection_userId_idx" ON "MailConnection"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MailOAuthSession_state_key" ON "MailOAuthSession"("state");

-- CreateIndex
CREATE INDEX "MailOAuthSession_userId_provider_expiresAt_idx" ON "MailOAuthSession"("userId", "provider", "expiresAt");

-- AddForeignKey
ALTER TABLE "MailConnection" ADD CONSTRAINT "MailConnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MailOAuthSession" ADD CONSTRAINT "MailOAuthSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
