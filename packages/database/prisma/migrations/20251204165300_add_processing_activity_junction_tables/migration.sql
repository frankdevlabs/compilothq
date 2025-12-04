-- =============================================================================
-- Processing Activity Junction Tables Migration
-- Migration: 20251204165300_add_processing_activity_junction_tables
-- Date: 2025-12-04
--
-- This migration implements four junction tables linking DataProcessingActivity
-- to Purpose, DataSubjectCategory, DataCategory, and Recipient models to enable
-- many-to-many relationships for GDPR Article 30 compliance tracking.
--
-- Database Objects Created:
-- - 4 Junction Tables (DataProcessingActivityPurpose, DataProcessingActivityDataSubject,
--   DataProcessingActivityDataCategory, DataProcessingActivityRecipient)
-- - 12 Indexes (bidirectional indexes for query performance)
-- - 8 Foreign Keys (Activity side: Cascade, Component side: Restrict)
-- - 4 Unique Constraints (prevent duplicate relationships)
--
-- Data Migration:
-- - Migrates existing Recipient.activityIds array data to DataProcessingActivityRecipient junction records
-- - Drops Recipient.activityIds column after successful migration
--
-- Rationale:
-- - Replaces temporary activityIds array field on Recipient model with proper junction table
-- - Enables true many-to-many relationships between activities and components
-- - Follows exact pattern from DataCategoryDataNature junction table
-- - Supports future extension for third-country transfer tracking (Roadmap item 15)
-- =============================================================================

-- CreateTable: DataProcessingActivityPurpose junction table
CREATE TABLE "DataProcessingActivityPurpose" (
    "id" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "purposeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DataProcessingActivityPurpose_pkey" PRIMARY KEY ("id")
);

-- CreateTable: DataProcessingActivityDataSubject junction table
CREATE TABLE "DataProcessingActivityDataSubject" (
    "id" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "dataSubjectCategoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DataProcessingActivityDataSubject_pkey" PRIMARY KEY ("id")
);

-- CreateTable: DataProcessingActivityDataCategory junction table
CREATE TABLE "DataProcessingActivityDataCategory" (
    "id" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "dataCategoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DataProcessingActivityDataCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable: DataProcessingActivityRecipient junction table
-- NOTE: May be extended in Roadmap item 15 to support third-country transfer tracking
CREATE TABLE "DataProcessingActivityRecipient" (
    "id" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DataProcessingActivityRecipient_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: Bidirectional indexes for DataProcessingActivityPurpose
CREATE INDEX "DataProcessingActivityPurpose_activityId_idx" ON "DataProcessingActivityPurpose"("activityId");
CREATE INDEX "DataProcessingActivityPurpose_purposeId_idx" ON "DataProcessingActivityPurpose"("purposeId");

-- CreateIndex: Bidirectional indexes for DataProcessingActivityDataSubject
CREATE INDEX "DataProcessingActivityDataSubject_activityId_idx" ON "DataProcessingActivityDataSubject"("activityId");
CREATE INDEX "DataProcessingActivityDataSubject_dataSubjectCategoryId_idx" ON "DataProcessingActivityDataSubject"("dataSubjectCategoryId");

-- CreateIndex: Bidirectional indexes for DataProcessingActivityDataCategory
CREATE INDEX "DataProcessingActivityDataCategory_activityId_idx" ON "DataProcessingActivityDataCategory"("activityId");
CREATE INDEX "DataProcessingActivityDataCategory_dataCategoryId_idx" ON "DataProcessingActivityDataCategory"("dataCategoryId");

-- CreateIndex: Bidirectional indexes for DataProcessingActivityRecipient
CREATE INDEX "DataProcessingActivityRecipient_activityId_idx" ON "DataProcessingActivityRecipient"("activityId");
CREATE INDEX "DataProcessingActivityRecipient_recipientId_idx" ON "DataProcessingActivityRecipient"("recipientId");

-- CreateUniqueConstraint: Prevent duplicate DataProcessingActivityPurpose relationships
CREATE UNIQUE INDEX "DataProcessingActivityPurpose_activityId_purposeId_key" ON "DataProcessingActivityPurpose"("activityId", "purposeId");

-- CreateUniqueConstraint: Prevent duplicate DataProcessingActivityDataSubject relationships
CREATE UNIQUE INDEX "DataProcessingActivityDataSubject_activityId_dataSubjectCategoryId_key" ON "DataProcessingActivityDataSubject"("activityId", "dataSubjectCategoryId");

-- CreateUniqueConstraint: Prevent duplicate DataProcessingActivityDataCategory relationships
CREATE UNIQUE INDEX "DataProcessingActivityDataCategory_activityId_dataCategoryId_key" ON "DataProcessingActivityDataCategory"("activityId", "dataCategoryId");

-- CreateUniqueConstraint: Prevent duplicate DataProcessingActivityRecipient relationships
CREATE UNIQUE INDEX "DataProcessingActivityRecipient_activityId_recipientId_key" ON "DataProcessingActivityRecipient"("activityId", "recipientId");

-- AddForeignKey: DataProcessingActivityPurpose.activityId -> DataProcessingActivity (CASCADE)
ALTER TABLE "DataProcessingActivityPurpose" ADD CONSTRAINT "DataProcessingActivityPurpose_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "DataProcessingActivity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: DataProcessingActivityPurpose.purposeId -> Purpose (RESTRICT)
ALTER TABLE "DataProcessingActivityPurpose" ADD CONSTRAINT "DataProcessingActivityPurpose_purposeId_fkey" FOREIGN KEY ("purposeId") REFERENCES "Purpose"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: DataProcessingActivityDataSubject.activityId -> DataProcessingActivity (CASCADE)
ALTER TABLE "DataProcessingActivityDataSubject" ADD CONSTRAINT "DataProcessingActivityDataSubject_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "DataProcessingActivity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: DataProcessingActivityDataSubject.dataSubjectCategoryId -> DataSubjectCategory (RESTRICT)
ALTER TABLE "DataProcessingActivityDataSubject" ADD CONSTRAINT "DataProcessingActivityDataSubject_dataSubjectCategoryId_fkey" FOREIGN KEY ("dataSubjectCategoryId") REFERENCES "DataSubjectCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: DataProcessingActivityDataCategory.activityId -> DataProcessingActivity (CASCADE)
ALTER TABLE "DataProcessingActivityDataCategory" ADD CONSTRAINT "DataProcessingActivityDataCategory_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "DataProcessingActivity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: DataProcessingActivityDataCategory.dataCategoryId -> DataCategory (RESTRICT)
ALTER TABLE "DataProcessingActivityDataCategory" ADD CONSTRAINT "DataProcessingActivityDataCategory_dataCategoryId_fkey" FOREIGN KEY ("dataCategoryId") REFERENCES "DataCategory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey: DataProcessingActivityRecipient.activityId -> DataProcessingActivity (CASCADE)
ALTER TABLE "DataProcessingActivityRecipient" ADD CONSTRAINT "DataProcessingActivityRecipient_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "DataProcessingActivity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: DataProcessingActivityRecipient.recipientId -> Recipient (RESTRICT)
ALTER TABLE "DataProcessingActivityRecipient" ADD CONSTRAINT "DataProcessingActivityRecipient_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "Recipient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Data Migration: Migrate existing Recipient.activityIds to DataProcessingActivityRecipient junction records
-- This migration handles the existing activityIds array field on Recipient model
-- Each activityId in the array becomes a junction record linking recipient to activity
INSERT INTO "DataProcessingActivityRecipient" ("id", "activityId", "recipientId", "createdAt")
SELECT
    gen_random_uuid() AS "id",
    unnest("activityIds") AS "activityId",
    "id" AS "recipientId",
    CURRENT_TIMESTAMP AS "createdAt"
FROM "Recipient"
WHERE array_length("activityIds", 1) > 0;

-- AlterTable: Drop activityIds column from Recipient model
-- This temporary field is now replaced by DataProcessingActivityRecipient junction table
ALTER TABLE "Recipient" DROP COLUMN "activityIds";
