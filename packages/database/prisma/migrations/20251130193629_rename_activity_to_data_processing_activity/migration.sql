-- Migration: rename_activity_to_data_processing_activity
-- This migration renames the Activity model to DataProcessingActivity and adds comprehensive GDPR compliance fields

-- 1. Rename the enum type (preserves existing values)
ALTER TYPE "ActivityStatus" RENAME TO "DataProcessingActivityStatus";

-- 2. Add new enum values to DataProcessingActivityStatus
ALTER TYPE "DataProcessingActivityStatus" ADD VALUE 'UNDER_REVIEW';
ALTER TYPE "DataProcessingActivityStatus" ADD VALUE 'UNDER_REVISION';
ALTER TYPE "DataProcessingActivityStatus" ADD VALUE 'REJECTED';
ALTER TYPE "DataProcessingActivityStatus" ADD VALUE 'APPROVED';
ALTER TYPE "DataProcessingActivityStatus" ADD VALUE 'SUSPENDED';

-- 3. Create new enums
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');
CREATE TYPE "DPIAStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'UNDER_REVIEW', 'REQUIRES_REVISION', 'APPROVED', 'OUTDATED');
CREATE TYPE "TimeUnit" AS ENUM ('DAYS', 'MONTHS', 'YEARS');

-- 4. Rename the table (preserves all existing data and indexes)
ALTER TABLE "Activity" RENAME TO "DataProcessingActivity";

-- 5. Add new columns to DataProcessingActivity
ALTER TABLE "DataProcessingActivity" ADD COLUMN "riskLevel" "RiskLevel";
ALTER TABLE "DataProcessingActivity" ADD COLUMN "requiresDPIA" BOOLEAN;
ALTER TABLE "DataProcessingActivity" ADD COLUMN "dpiaStatus" "DPIAStatus";
ALTER TABLE "DataProcessingActivity" ADD COLUMN "businessOwnerId" TEXT;
ALTER TABLE "DataProcessingActivity" ADD COLUMN "processingOwnerId" TEXT;
ALTER TABLE "DataProcessingActivity" ADD COLUMN "retentionPeriodValue" INTEGER;
ALTER TABLE "DataProcessingActivity" ADD COLUMN "retentionPeriodUnit" "TimeUnit";
ALTER TABLE "DataProcessingActivity" ADD COLUMN "retentionJustification" TEXT;
ALTER TABLE "DataProcessingActivity" ADD COLUMN "lastReviewedAt" TIMESTAMP(3);
ALTER TABLE "DataProcessingActivity" ADD COLUMN "nextReviewDate" TIMESTAMP(3);
ALTER TABLE "DataProcessingActivity" ADD COLUMN "reviewFrequencyMonths" INTEGER;
ALTER TABLE "DataProcessingActivity" ADD COLUMN "metadata" JSONB;

-- 6. Add foreign key constraints for owner fields
ALTER TABLE "DataProcessingActivity"
  ADD CONSTRAINT "DataProcessingActivity_businessOwnerId_fkey"
  FOREIGN KEY ("businessOwnerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "DataProcessingActivity"
  ADD CONSTRAINT "DataProcessingActivity_processingOwnerId_fkey"
  FOREIGN KEY ("processingOwnerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 7. Add new compound indexes
CREATE INDEX "DataProcessingActivity_organizationId_status_requiresDPIA_idx"
  ON "DataProcessingActivity"("organizationId", "status", "requiresDPIA");

CREATE INDEX "DataProcessingActivity_organizationId_nextReviewDate_idx"
  ON "DataProcessingActivity"("organizationId", "nextReviewDate");

CREATE INDEX "DataProcessingActivity_riskLevel_dpiaStatus_idx"
  ON "DataProcessingActivity"("riskLevel", "dpiaStatus");
