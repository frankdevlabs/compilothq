/*
  Migration: Add RecipientProcessingLocation Model
  Roadmap Item: 15 - RecipientProcessingLocation Model and Cross-Border Transfer Detection

  Purpose:
  Track WHERE a recipient/processor processes personal data for automated cross-border
  transfer detection and GDPR Article 44-46 compliance.

  Table Structure:
  - RecipientProcessingLocation: Processing location records with country, service, and transfer mechanism
  - Parallel pattern to AssetProcessingLocation (Item 14) for consistency

  Indexes:
  1. (organizationId, recipientId) - Recipient location lookup (high selectivity)
  2. (organizationId, countryId) - Geographic compliance queries (medium selectivity)
  3. (organizationId, transferMechanismId) - Mechanism auditing (medium selectivity)

  Foreign Keys:
  - organization: CASCADE (locations are tenant-scoped data)
  - recipient: CASCADE (locations are properties of recipients)
  - country: RESTRICT (cannot delete countries in use)
  - purpose: SET NULL (optional link, purposeText provides fallback)
  - transferMechanism: SET NULL (optional, not needed for same-jurisdiction processing)

  No Backward Compatibility Concerns:
  - New table with no existing data
  - No dependencies on existing features

  Rollback Strategy:
  - Safe to drop table if needed (no data loss risk)
  - Command: DROP TABLE "RecipientProcessingLocation";
*/

-- CreateTable
CREATE TABLE "RecipientProcessingLocation" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "service" TEXT NOT NULL,
    "purposeId" TEXT,
    "purposeText" TEXT,
    "countryId" TEXT NOT NULL,
    "locationRole" "LocationRole" NOT NULL,
    "transferMechanismId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecipientProcessingLocation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RecipientProcessingLocation_organizationId_recipientId_idx" ON "RecipientProcessingLocation"("organizationId", "recipientId");

-- CreateIndex
CREATE INDEX "RecipientProcessingLocation_organizationId_countryId_idx" ON "RecipientProcessingLocation"("organizationId", "countryId");

-- CreateIndex
CREATE INDEX "RecipientProcessingLocation_organizationId_transferMechanis_idx" ON "RecipientProcessingLocation"("organizationId", "transferMechanismId");

-- AddForeignKey
ALTER TABLE "RecipientProcessingLocation" ADD CONSTRAINT "RecipientProcessingLocation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipientProcessingLocation" ADD CONSTRAINT "RecipientProcessingLocation_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "Recipient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipientProcessingLocation" ADD CONSTRAINT "RecipientProcessingLocation_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipientProcessingLocation" ADD CONSTRAINT "RecipientProcessingLocation_purposeId_fkey" FOREIGN KEY ("purposeId") REFERENCES "Purpose"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipientProcessingLocation" ADD CONSTRAINT "RecipientProcessingLocation_transferMechanismId_fkey" FOREIGN KEY ("transferMechanismId") REFERENCES "TransferMechanism"("id") ON DELETE SET NULL ON UPDATE CASCADE;
