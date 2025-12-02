-- CreateEnum
CREATE TYPE "PurposeCategory" AS ENUM ('MARKETING', 'ANALYTICS', 'CUSTOMER_SERVICE', 'HR', 'LEGAL_COMPLIANCE', 'SECURITY', 'PRODUCT_DELIVERY', 'RESEARCH_DEVELOPMENT', 'FINANCIAL', 'OTHER');

-- CreateEnum
CREATE TYPE "PurposeScope" AS ENUM ('INTERNAL', 'EXTERNAL', 'BOTH');

-- CreateEnum
CREATE TYPE "LegalBasisType" AS ENUM ('CONSENT', 'CONTRACT', 'LEGAL_OBLIGATION', 'VITAL_INTERESTS', 'PUBLIC_TASK', 'LEGITIMATE_INTERESTS');

-- CreateEnum
CREATE TYPE "RegulatoryFramework" AS ENUM ('GDPR', 'UK_GDPR', 'LGPD', 'CCPA', 'PIPEDA', 'POPIA', 'PDPA_SG', 'OTHER');

-- AlterTable (handle if constraint exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Activity_pkey') THEN
        ALTER TABLE "DataProcessingActivity" RENAME CONSTRAINT "Activity_pkey" TO "DataProcessingActivity_pkey";
    END IF;
END $$;

-- CreateTable
CREATE TABLE "LegalBasis" (
    "id" TEXT NOT NULL,
    "type" "LegalBasisType" NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "framework" "RegulatoryFramework" NOT NULL DEFAULT 'GDPR',
    "articleReference" TEXT NOT NULL,
    "articleDetails" JSONB,
    "applicableFrameworks" JSONB,
    "requiresConsent" BOOLEAN NOT NULL DEFAULT false,
    "requiresExplicitConsent" BOOLEAN NOT NULL DEFAULT false,
    "requiresOptIn" BOOLEAN NOT NULL DEFAULT false,
    "withdrawalSupported" BOOLEAN NOT NULL DEFAULT false,
    "requiresLIA" BOOLEAN NOT NULL DEFAULT false,
    "requiresBalancingTest" BOOLEAN NOT NULL DEFAULT false,
    "usageGuidance" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LegalBasis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Purpose" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "PurposeCategory" NOT NULL,
    "scope" "PurposeScope" NOT NULL,
    "organizationId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Purpose_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LegalBasis_type_idx" ON "LegalBasis"("type");

-- CreateIndex
CREATE INDEX "LegalBasis_framework_idx" ON "LegalBasis"("framework");

-- CreateIndex
CREATE INDEX "Purpose_organizationId_idx" ON "Purpose"("organizationId");

-- CreateIndex
CREATE INDEX "Purpose_organizationId_isActive_idx" ON "Purpose"("organizationId", "isActive");

-- CreateIndex
CREATE INDEX "Purpose_organizationId_category_idx" ON "Purpose"("organizationId", "category");

-- RenameForeignKey (handle if constraint exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'Activity_organizationId_fkey') THEN
        ALTER TABLE "DataProcessingActivity" RENAME CONSTRAINT "Activity_organizationId_fkey" TO "DataProcessingActivity_organizationId_fkey";
    END IF;
END $$;

-- AddForeignKey
ALTER TABLE "Purpose" ADD CONSTRAINT "Purpose_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex (handle if index exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Activity_organizationId_idx') THEN
        ALTER INDEX "Activity_organizationId_idx" RENAME TO "DataProcessingActivity_organizationId_idx";
    END IF;
END $$;

-- RenameIndex (handle if index exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Activity_organizationId_status_idx') THEN
        ALTER INDEX "Activity_organizationId_status_idx" RENAME TO "DataProcessingActivity_organizationId_status_idx";
    END IF;
END $$;
