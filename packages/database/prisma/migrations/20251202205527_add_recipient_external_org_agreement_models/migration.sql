-- Migration: Add Recipient, ExternalOrganization, and Agreement Models
-- This migration renames Processor → Recipient and adds new models while preserving existing data

-- ============================================================================
-- Step 1: Create New Enums
-- ============================================================================

-- Create RecipientType enum (expanded from ProcessorType)
CREATE TYPE "RecipientType" AS ENUM (
  'PROCESSOR',           -- Maps from DATA_PROCESSOR
  'SUB_PROCESSOR',       -- Maps from SUB_PROCESSOR
  'JOINT_CONTROLLER',    -- Maps from JOINT_CONTROLLER
  'SERVICE_PROVIDER',    -- Maps from SERVICE_PROVIDER
  'SEPARATE_CONTROLLER', -- NEW
  'PUBLIC_AUTHORITY',    -- NEW
  'INTERNAL_DEPARTMENT'  -- NEW
);

-- Create HierarchyType enum
CREATE TYPE "HierarchyType" AS ENUM ('PROCESSOR_CHAIN', 'ORGANIZATIONAL', 'GROUPING');

-- Create AgreementType enum
CREATE TYPE "AgreementType" AS ENUM ('DPA', 'JOINT_CONTROLLER_AGREEMENT', 'SCC', 'BCR', 'DPF', 'NDA');

-- Create AgreementStatus enum
CREATE TYPE "AgreementStatus" AS ENUM ('DRAFT', 'PENDING_SIGNATURE', 'ACTIVE', 'EXPIRING_SOON', 'EXPIRED', 'TERMINATED');

-- ============================================================================
-- Step 2: Create ExternalOrganization Table
-- ============================================================================

CREATE TABLE "ExternalOrganization" (
    "id" TEXT NOT NULL,
    "legalName" TEXT NOT NULL,
    "tradingName" TEXT,
    "jurisdiction" TEXT,
    "registrationNumber" TEXT,
    "vatNumber" TEXT,
    "headquartersCountryId" TEXT,
    "operatingCountries" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "website" TEXT,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "isPublicAuthority" BOOLEAN NOT NULL DEFAULT false,
    "sector" TEXT,
    "notes" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExternalOrganization_pkey" PRIMARY KEY ("id")
);

-- Create indexes for ExternalOrganization
CREATE INDEX "ExternalOrganization_legalName_idx" ON "ExternalOrganization"("legalName");
CREATE INDEX "ExternalOrganization_tradingName_idx" ON "ExternalOrganization"("tradingName");
CREATE INDEX "ExternalOrganization_headquartersCountryId_idx" ON "ExternalOrganization"("headquartersCountryId");

-- Add foreign key for headquartersCountryId
ALTER TABLE "ExternalOrganization"
  ADD CONSTRAINT "ExternalOrganization_headquartersCountryId_fkey"
  FOREIGN KEY ("headquartersCountryId") REFERENCES "Country"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================================================
-- Step 3: Migrate Processor → Recipient (Preserve Data)
-- ============================================================================

-- Create temporary mapping table for ProcessorType → RecipientType
CREATE TEMP TABLE type_mapping (
  old_type TEXT,
  new_type "RecipientType"
);

INSERT INTO type_mapping (old_type, new_type) VALUES
  ('DATA_PROCESSOR', 'PROCESSOR'),
  ('SUB_PROCESSOR', 'SUB_PROCESSOR'),
  ('JOINT_CONTROLLER', 'JOINT_CONTROLLER'),
  ('SERVICE_PROVIDER', 'SERVICE_PROVIDER');

-- Create ExternalOrganization records from existing Processor names
-- Only if there are existing Processor records
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "Processor" LIMIT 1) THEN
    INSERT INTO "ExternalOrganization" (id, "legalName", "tradingName", "isPublicAuthority", "createdAt", "updatedAt")
    SELECT
      gen_random_uuid()::text,
      name,
      name,
      false,
      NOW(),
      NOW()
    FROM "Processor"
    GROUP BY name
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Drop the foreign key constraint before table operations
ALTER TABLE "Processor" DROP CONSTRAINT IF EXISTS "Processor_organizationId_fkey";

-- Rename Processor table to Recipient
ALTER TABLE "Processor" RENAME TO "Recipient";

-- Add new columns to Recipient table
ALTER TABLE "Recipient" ADD COLUMN "externalOrganizationId" TEXT;
ALTER TABLE "Recipient" ADD COLUMN "purpose" TEXT;
ALTER TABLE "Recipient" ADD COLUMN "parentRecipientId" TEXT;
ALTER TABLE "Recipient" ADD COLUMN "hierarchyType" "HierarchyType";
ALTER TABLE "Recipient" ADD COLUMN "activityIds" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Migrate type column from ProcessorType to RecipientType
-- Step 3a: Add temporary column with new type
ALTER TABLE "Recipient" ADD COLUMN "type_new" "RecipientType";

-- Step 3b: Map old values to new values
UPDATE "Recipient" SET "type_new" =
  CASE
    WHEN "type"::text = 'DATA_PROCESSOR' THEN 'PROCESSOR'::"RecipientType"
    WHEN "type"::text = 'SUB_PROCESSOR' THEN 'SUB_PROCESSOR'::"RecipientType"
    WHEN "type"::text = 'JOINT_CONTROLLER' THEN 'JOINT_CONTROLLER'::"RecipientType"
    WHEN "type"::text = 'SERVICE_PROVIDER' THEN 'SERVICE_PROVIDER'::"RecipientType"
    ELSE 'PROCESSOR'::"RecipientType" -- Default fallback
  END;

-- Step 3c: Drop old type column
ALTER TABLE "Recipient" DROP COLUMN "type";

-- Step 3d: Rename new type column to 'type'
ALTER TABLE "Recipient" RENAME COLUMN "type_new" TO "type";

-- Step 3e: Make type column NOT NULL
ALTER TABLE "Recipient" ALTER COLUMN "type" SET NOT NULL;

-- Link Recipients to ExternalOrganizations based on name
UPDATE "Recipient" r
SET "externalOrganizationId" = eo.id
FROM "ExternalOrganization" eo
WHERE r.name = eo."legalName";

-- Drop old ProcessorType enum
DROP TYPE IF EXISTS "ProcessorType";

-- ============================================================================
-- Step 4: Create Indexes for Recipient
-- ============================================================================

-- Drop old Processor indexes (they were renamed automatically with the table)
DROP INDEX IF EXISTS "Processor_organizationId_idx";
DROP INDEX IF EXISTS "Processor_organizationId_isActive_idx";

-- Create new Recipient indexes
CREATE INDEX "Recipient_organizationId_idx" ON "Recipient"("organizationId");
CREATE INDEX "Recipient_organizationId_isActive_idx" ON "Recipient"("organizationId", "isActive");
CREATE INDEX "Recipient_organizationId_type_idx" ON "Recipient"("organizationId", "type");
CREATE INDEX "Recipient_externalOrganizationId_idx" ON "Recipient"("externalOrganizationId");
CREATE INDEX "Recipient_parentRecipientId_idx" ON "Recipient"("parentRecipientId");

-- ============================================================================
-- Step 5: Add Foreign Key Constraints for Recipient
-- ============================================================================

-- Re-add organizationId foreign key
ALTER TABLE "Recipient"
  ADD CONSTRAINT "Recipient_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Add externalOrganizationId foreign key
ALTER TABLE "Recipient"
  ADD CONSTRAINT "Recipient_externalOrganizationId_fkey"
  FOREIGN KEY ("externalOrganizationId") REFERENCES "ExternalOrganization"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- Add self-referential parentRecipientId foreign key
ALTER TABLE "Recipient"
  ADD CONSTRAINT "Recipient_parentRecipientId_fkey"
  FOREIGN KEY ("parentRecipientId") REFERENCES "Recipient"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

-- ============================================================================
-- Step 6: Create Agreement Table
-- ============================================================================

CREATE TABLE "Agreement" (
    "id" TEXT NOT NULL,
    "externalOrganizationId" TEXT NOT NULL,
    "type" "AgreementType" NOT NULL,
    "status" "AgreementStatus" NOT NULL DEFAULT 'DRAFT',
    "signedDate" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Agreement_pkey" PRIMARY KEY ("id")
);

-- Create indexes for Agreement
CREATE INDEX "Agreement_externalOrganizationId_idx" ON "Agreement"("externalOrganizationId");
CREATE INDEX "Agreement_type_idx" ON "Agreement"("type");
CREATE INDEX "Agreement_status_idx" ON "Agreement"("status");
CREATE INDEX "Agreement_expiryDate_idx" ON "Agreement"("expiryDate");

-- Add foreign key for Agreement
ALTER TABLE "Agreement"
  ADD CONSTRAINT "Agreement_externalOrganizationId_fkey"
  FOREIGN KEY ("externalOrganizationId") REFERENCES "ExternalOrganization"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- ============================================================================
-- Step 7: Fix DataProcessingActivity Constraint/Index Names
-- ============================================================================

-- Rename primary key constraint
ALTER TABLE "DataProcessingActivity" RENAME CONSTRAINT "Activity_pkey" TO "DataProcessingActivity_pkey";

-- Rename foreign key constraint
ALTER TABLE "DataProcessingActivity" RENAME CONSTRAINT "Activity_organizationId_fkey" TO "DataProcessingActivity_organizationId_fkey";

-- Rename indexes
ALTER INDEX "Activity_organizationId_idx" RENAME TO "DataProcessingActivity_organizationId_idx";
ALTER INDEX "Activity_organizationId_status_idx" RENAME TO "DataProcessingActivity_organizationId_status_idx";

-- ============================================================================
-- Migration Complete
-- ============================================================================
-- Summary:
-- ✅ Created new enums: RecipientType, HierarchyType, AgreementType, AgreementStatus
-- ✅ Created ExternalOrganization table
-- ✅ Renamed Processor → Recipient (preserved data)
-- ✅ Migrated ProcessorType → RecipientType (with type mapping)
-- ✅ Created ExternalOrganization records from Processor names
-- ✅ Linked Recipients to ExternalOrganizations
-- ✅ Added new columns: externalOrganizationId, purpose, parentRecipientId, hierarchyType, activityIds
-- ✅ Created Agreement table
-- ✅ Created all indexes
-- ✅ Added all foreign key constraints
-- ✅ Fixed DataProcessingActivity constraint/index names
