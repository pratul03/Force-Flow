-- CreateEnum
CREATE TYPE "BillingProvider" AS ENUM ('STRIPE', 'RAZORPAY');

-- CreateEnum
CREATE TYPE "SubscriptionInterval" AS ENUM ('MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "OrganizationSubscriptionStatus" AS ENUM ('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "SubscriptionCheckoutStatus" AS ENUM ('PENDING', 'COMPLETED', 'EXPIRED', 'CANCELED');

-- CreateEnum
CREATE TYPE "SubscriptionEventType" AS ENUM (
  'CHECKOUT_CREATED',
  'CHECKOUT_COMPLETED',
  'SUBSCRIPTION_ACTIVATED',
  'SUBSCRIPTION_UPDATED',
  'SUBSCRIPTION_CANCELED',
  'WEBHOOK_RECEIVED'
);

-- CreateTable
CREATE TABLE "SubscriptionPlan" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "price" DOUBLE PRECISION NOT NULL,
  "currency" "Currency" NOT NULL DEFAULT 'USD',
  "interval" "SubscriptionInterval" NOT NULL,
  "trialDays" INTEGER NOT NULL DEFAULT 14,
  "employeeLimit" INTEGER,
  "features" JSONB,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SubscriptionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationSubscription" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "provider" "BillingProvider" NOT NULL,
  "status" "OrganizationSubscriptionStatus" NOT NULL DEFAULT 'TRIALING',
  "providerCustomerId" TEXT,
  "providerSubscriptionId" TEXT,
  "currentPeriodStart" TIMESTAMP(3) NOT NULL,
  "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
  "trialStart" TIMESTAMP(3),
  "trialEnd" TIMESTAMP(3),
  "canceledAt" TIMESTAMP(3),
  "metadata" JSONB,
  "createdByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "OrganizationSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionCheckoutSession" (
  "id" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "provider" "BillingProvider" NOT NULL,
  "providerSessionId" TEXT,
  "status" "SubscriptionCheckoutStatus" NOT NULL DEFAULT 'PENDING',
  "checkoutUrl" TEXT NOT NULL,
  "successUrl" TEXT,
  "cancelUrl" TEXT,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "completedAt" TIMESTAMP(3),
  "createdByUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SubscriptionCheckoutSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionEvent" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "organizationSubscriptionId" TEXT,
  "checkoutSessionId" TEXT,
  "type" "SubscriptionEventType" NOT NULL,
  "provider" "BillingProvider",
  "payload" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SubscriptionEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPlan_code_key" ON "SubscriptionPlan"("code");
CREATE INDEX "SubscriptionPlan_isActive_sortOrder_idx" ON "SubscriptionPlan"("isActive", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationSubscription_organizationId_key" ON "OrganizationSubscription"("organizationId");
CREATE INDEX "OrganizationSubscription_planId_idx" ON "OrganizationSubscription"("planId");
CREATE INDEX "OrganizationSubscription_status_idx" ON "OrganizationSubscription"("status");
CREATE INDEX "OrganizationSubscription_providerSubscriptionId_idx" ON "OrganizationSubscription"("providerSubscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionCheckoutSession_token_key" ON "SubscriptionCheckoutSession"("token");
CREATE UNIQUE INDEX "SubscriptionCheckoutSession_providerSessionId_key" ON "SubscriptionCheckoutSession"("providerSessionId");
CREATE INDEX "SubscriptionCheckoutSession_organizationId_status_idx" ON "SubscriptionCheckoutSession"("organizationId", "status");
CREATE INDEX "SubscriptionCheckoutSession_planId_idx" ON "SubscriptionCheckoutSession"("planId");
CREATE INDEX "SubscriptionCheckoutSession_expiresAt_idx" ON "SubscriptionCheckoutSession"("expiresAt");

-- CreateIndex
CREATE INDEX "SubscriptionEvent_organizationId_createdAt_idx" ON "SubscriptionEvent"("organizationId", "createdAt");
CREATE INDEX "SubscriptionEvent_organizationSubscriptionId_idx" ON "SubscriptionEvent"("organizationSubscriptionId");
CREATE INDEX "SubscriptionEvent_checkoutSessionId_idx" ON "SubscriptionEvent"("checkoutSessionId");

-- AddForeignKey
ALTER TABLE "OrganizationSubscription"
ADD CONSTRAINT "OrganizationSubscription_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "OrganizationSubscription"
ADD CONSTRAINT "OrganizationSubscription_planId_fkey"
FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "OrganizationSubscription"
ADD CONSTRAINT "OrganizationSubscription_createdByUserId_fkey"
FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "SubscriptionCheckoutSession"
ADD CONSTRAINT "SubscriptionCheckoutSession_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "SubscriptionCheckoutSession"
ADD CONSTRAINT "SubscriptionCheckoutSession_planId_fkey"
FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "SubscriptionCheckoutSession"
ADD CONSTRAINT "SubscriptionCheckoutSession_createdByUserId_fkey"
FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "SubscriptionEvent"
ADD CONSTRAINT "SubscriptionEvent_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "SubscriptionEvent"
ADD CONSTRAINT "SubscriptionEvent_organizationSubscriptionId_fkey"
FOREIGN KEY ("organizationSubscriptionId") REFERENCES "OrganizationSubscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "SubscriptionEvent"
ADD CONSTRAINT "SubscriptionEvent_checkoutSessionId_fkey"
FOREIGN KEY ("checkoutSessionId") REFERENCES "SubscriptionCheckoutSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed plans
INSERT INTO "SubscriptionPlan" (
  "id", "code", "name", "description", "price", "currency", "interval", "trialDays", "employeeLimit", "features", "isActive", "sortOrder", "createdAt", "updatedAt"
)
VALUES
(
  'plan_starter_monthly',
  'STARTER_MONTHLY',
  'Starter',
  'Perfect for small teams',
  99,
  'USD',
  'MONTHLY',
  14,
  50,
  '["Up to 50 employees", "Basic employee management", "Simple timesheet tracking", "Leave request management", "Email support"]'::jsonb,
  true,
  10,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
),
(
  'plan_professional_monthly',
  'PROFESSIONAL_MONTHLY',
  'Professional',
  'For growing businesses',
  299,
  'USD',
  'MONTHLY',
  14,
  500,
  '["Up to 500 employees", "Advanced employee management", "Timesheet with approval workflow", "Leave management & policies", "Analytics & reports", "Priority email & chat support", "Custom branding"]'::jsonb,
  true,
  20,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("code") DO NOTHING;
