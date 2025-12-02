-- =============================================================================
-- Consolidated GDPR Compliance Foundation Models
-- Migration: 20251202203143_add_gdpr_compliance_foundation_models
-- Date: 2025-12-02
--
-- This migration consolidates four related models into a single atomic operation:
--
-- 1. Purpose - Processing purpose tracking (org-scoped)
--    Categories: MARKETING, ANALYTICS, CUSTOMER_SERVICE, HR, LEGAL_COMPLIANCE,
--    SECURITY, PRODUCT_DELIVERY, RESEARCH_DEVELOPMENT, FINANCIAL, OTHER
--    Scopes: INTERNAL, EXTERNAL, BOTH
--    Purpose: Track WHY personal data is processed per GDPR Article 5(1)(b)
--
-- 2. LegalBasis - GDPR Article 6/9 lawful bases (reference data)
--    Types: CONSENT, CONTRACT, LEGAL_OBLIGATION, VITAL_INTERESTS,
--    PUBLIC_TASK, LEGITIMATE_INTERESTS
--    Features: Consent tracking, LIA requirements, multi-framework support
--    Purpose: Document legal grounds for processing per GDPR Article 6
--
-- 3. DataCategory - Personal data classification (org-scoped)
--    Sensitivity: PUBLIC, INTERNAL, CONFIDENTIAL, RESTRICTED
--    Auto-detects GDPR Article 9 special categories via DataNature links
--    Purpose: Classify personal data with sensitivity levels
--
-- 4. DataSubjectCategory - Data subject types (hybrid scope)
--    Categories: EMPLOYEE, CUSTOMER, MINOR, PATIENT, STUDENT, etc.
--    Features: Vulnerability tracking per Article 35(3)(c)
--    Purpose: Identify vulnerable data subjects and trigger DPIA requirements
--
-- Rationale for Consolidation:
-- - Originally developed in separate feature branches
-- - Branch timestamps would have created migration order conflicts:
--   * Feature branch: 20251202192221 (Purpose + LegalBasis)
--   * Main branch: 20251202143622 (DataCategory)
-- - Consolidated to prevent ambiguous migration history
-- - Fixes schema drift: DataSubjectCategory was in schema without migration
-- - Enables atomic deployment of related GDPR compliance features
-- - Creates clearer semantic grouping of compliance foundation
--
-- Database Objects Created:
-- - 5 Enums (PurposeCategory, PurposeScope, LegalBasisType, RegulatoryFramework, SensitivityLevel)
-- - 5 Tables (Purpose, LegalBasis, DataCategory, DataSubjectCategory, DataCategoryDataNature)
-- - 15 Indexes (optimized for org-scoped queries and filtering)
-- - 5 Foreign Keys (Organization cascade, DataNature restrict)
--
-- Additional Changes:
-- - Renames DataProcessingActivity constraint/indexes (cleanup from previous migration)
-- =============================================================================

-- CreateEnum
CREATE TYPE "SensitivityLevel" AS ENUM ('PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED');

-- CreateEnum
CREATE TYPE "PurposeCategory" AS ENUM ('MARKETING', 'ANALYTICS', 'CUSTOMER_SERVICE', 'HR', 'LEGAL_COMPLIANCE', 'SECURITY', 'PRODUCT_DELIVERY', 'RESEARCH_DEVELOPMENT', 'FINANCIAL', 'OTHER');

-- CreateEnum
CREATE TYPE "PurposeScope" AS ENUM ('INTERNAL', 'EXTERNAL', 'BOTH');

-- CreateEnum
CREATE TYPE "LegalBasisType" AS ENUM ('CONSENT', 'CONTRACT', 'LEGAL_OBLIGATION', 'VITAL_INTERESTS', 'PUBLIC_TASK', 'LEGITIMATE_INTERESTS');

-- CreateEnum
CREATE TYPE "RegulatoryFramework" AS ENUM ('GDPR', 'UK_GDPR', 'LGPD', 'CCPA', 'PIPEDA', 'POPIA', 'PDPA_SG', 'OTHER');

-- AlterTable
ALTER TABLE "DataProcessingActivity" RENAME CONSTRAINT "Activity_pkey" TO "DataProcessingActivity_pkey";

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
CREATE TABLE "DataSubjectCategory" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "examples" JSONB,
    "isVulnerable" BOOLEAN NOT NULL DEFAULT false,
    "vulnerabilityReason" TEXT,
    "vulnerabilityArticle" TEXT,
    "gdprArticle" TEXT,
    "suggestsDPIA" BOOLEAN NOT NULL DEFAULT false,
    "dpiaRationale" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isSystemDefined" BOOLEAN NOT NULL DEFAULT false,
    "organizationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DataSubjectCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataCategory" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "organizationId" TEXT NOT NULL,
    "sensitivity" "SensitivityLevel" NOT NULL,
    "isSpecialCategory" BOOLEAN NOT NULL,
    "exampleFields" JSONB,
    "metadata" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DataCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataCategoryDataNature" (
    "id" TEXT NOT NULL,
    "dataCategoryId" TEXT NOT NULL,
    "dataNatureId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DataCategoryDataNature_pkey" PRIMARY KEY ("id")
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
CREATE INDEX "DataSubjectCategory_organizationId_idx" ON "DataSubjectCategory"("organizationId");

-- CreateIndex
CREATE INDEX "DataSubjectCategory_organizationId_isActive_idx" ON "DataSubjectCategory"("organizationId", "isActive");

-- CreateIndex
CREATE INDEX "DataSubjectCategory_category_idx" ON "DataSubjectCategory"("category");

-- CreateIndex
CREATE UNIQUE INDEX "DataSubjectCategory_code_organizationId_key" ON "DataSubjectCategory"("code", "organizationId");

-- CreateIndex
CREATE INDEX "DataCategory_organizationId_idx" ON "DataCategory"("organizationId");

-- CreateIndex
CREATE INDEX "DataCategory_organizationId_sensitivity_idx" ON "DataCategory"("organizationId", "sensitivity");

-- CreateIndex
CREATE INDEX "DataCategory_organizationId_isSpecialCategory_idx" ON "DataCategory"("organizationId", "isSpecialCategory");

-- CreateIndex
CREATE INDEX "DataCategory_sensitivity_idx" ON "DataCategory"("sensitivity");

-- CreateIndex
CREATE INDEX "DataCategory_isSpecialCategory_idx" ON "DataCategory"("isSpecialCategory");

-- CreateIndex
CREATE INDEX "DataCategoryDataNature_dataCategoryId_idx" ON "DataCategoryDataNature"("dataCategoryId");

-- CreateIndex
CREATE INDEX "DataCategoryDataNature_dataNatureId_idx" ON "DataCategoryDataNature"("dataNatureId");

-- CreateIndex
CREATE UNIQUE INDEX "DataCategoryDataNature_dataCategoryId_dataNatureId_key" ON "DataCategoryDataNature"("dataCategoryId", "dataNatureId");

-- CreateIndex
CREATE INDEX "Purpose_organizationId_idx" ON "Purpose"("organizationId");

-- CreateIndex
CREATE INDEX "Purpose_organizationId_isActive_idx" ON "Purpose"("organizationId", "isActive");

-- CreateIndex
CREATE INDEX "Purpose_organizationId_category_idx" ON "Purpose"("organizationId", "category");

-- RenameForeignKey
ALTER TABLE "DataProcessingActivity" RENAME CONSTRAINT "Activity_organizationId_fkey" TO "DataProcessingActivity_organizationId_fkey";

-- AddForeignKey
ALTER TABLE "DataSubjectCategory" ADD CONSTRAINT "DataSubjectCategory_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataCategory" ADD CONSTRAINT "DataCategory_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataCategoryDataNature" ADD CONSTRAINT "DataCategoryDataNature_dataCategoryId_fkey" FOREIGN KEY ("dataCategoryId") REFERENCES "DataCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataCategoryDataNature" ADD CONSTRAINT "DataCategoryDataNature_dataNatureId_fkey" FOREIGN KEY ("dataNatureId") REFERENCES "DataNature"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purpose" ADD CONSTRAINT "Purpose_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "Activity_organizationId_idx" RENAME TO "DataProcessingActivity_organizationId_idx";

-- RenameIndex
ALTER INDEX "Activity_organizationId_status_idx" RENAME TO "DataProcessingActivity_organizationId_status_idx";
