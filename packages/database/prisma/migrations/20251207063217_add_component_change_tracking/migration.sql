-- CreateEnum
CREATE TYPE "ChangeType" AS ENUM ('CREATED', 'UPDATED', 'DELETED');

-- CreateEnum
CREATE TYPE "GeneratedDocumentType" AS ENUM ('ROPA', 'DPIA', 'LIA', 'DPA', 'PRIVACY_STATEMENT', 'DTIA');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('DRAFT', 'FINAL', 'SUPERSEDED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ImpactType" AS ENUM ('TRANSFER_SECTION_OUTDATED', 'MECHANISM_SECTION_OUTDATED', 'LOCATION_CHANGED', 'LOCATION_ADDED', 'LOCATION_REMOVED', 'THIRD_COUNTRY_ADDED', 'SAFEGUARD_REMOVED', 'PURPOSE_SECTION_OUTDATED', 'LEGAL_BASIS_SECTION_OUTDATED', 'DATA_CATEGORY_SECTION_OUTDATED', 'DATA_SUBJECT_SECTION_OUTDATED', 'RECIPIENT_SECTION_OUTDATED', 'ACTIVITY_RISK_LEVEL_CHANGED', 'ACTIVITY_DPIA_REQUIREMENT_CHANGED', 'RETENTION_SECTION_OUTDATED', 'OTHER_COMPONENT_CHANGED');

-- CreateTable
CREATE TABLE "ComponentChangeLog" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "componentType" TEXT NOT NULL,
    "componentId" TEXT NOT NULL,
    "changeType" "ChangeType" NOT NULL,
    "fieldChanged" TEXT,
    "oldValue" JSONB,
    "newValue" JSONB,
    "changedByUserId" TEXT,
    "changeReason" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ComponentChangeLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GeneratedDocument" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "documentType" "GeneratedDocumentType" NOT NULL,
    "version" TEXT NOT NULL,
    "assessmentId" TEXT,
    "dataProcessingActivityId" TEXT,
    "dataSnapshot" JSONB NOT NULL,
    "wordFileUrl" TEXT,
    "pdfFileUrl" TEXT,
    "markdownContent" TEXT,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "generatedBy" TEXT,
    "status" "DocumentStatus" NOT NULL DEFAULT 'DRAFT',

    CONSTRAINT "GeneratedDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AffectedDocument" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "generatedDocumentId" TEXT NOT NULL,
    "componentChangeLogId" TEXT NOT NULL,
    "impactType" "ImpactType" NOT NULL,
    "impactDescription" TEXT NOT NULL,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,

    CONSTRAINT "AffectedDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ComponentChangeLog_organizationId_componentType_componentId_idx" ON "ComponentChangeLog"("organizationId", "componentType", "componentId", "changedAt");

-- CreateIndex
CREATE INDEX "ComponentChangeLog_changedAt_idx" ON "ComponentChangeLog"("changedAt");

-- CreateIndex
CREATE INDEX "ComponentChangeLog_organizationId_changedAt_idx" ON "ComponentChangeLog"("organizationId", "changedAt");

-- CreateIndex
CREATE INDEX "GeneratedDocument_organizationId_documentType_status_idx" ON "GeneratedDocument"("organizationId", "documentType", "status");

-- CreateIndex
CREATE INDEX "GeneratedDocument_generatedAt_idx" ON "GeneratedDocument"("generatedAt");

-- CreateIndex
CREATE INDEX "AffectedDocument_organizationId_generatedDocumentId_idx" ON "AffectedDocument"("organizationId", "generatedDocumentId");

-- CreateIndex
CREATE INDEX "AffectedDocument_organizationId_detectedAt_idx" ON "AffectedDocument"("organizationId", "detectedAt");

-- CreateIndex
CREATE UNIQUE INDEX "AffectedDocument_generatedDocumentId_componentChangeLogId_key" ON "AffectedDocument"("generatedDocumentId", "componentChangeLogId");

-- AddForeignKey
ALTER TABLE "ComponentChangeLog" ADD CONSTRAINT "ComponentChangeLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ComponentChangeLog" ADD CONSTRAINT "ComponentChangeLog_changedByUserId_fkey" FOREIGN KEY ("changedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedDocument" ADD CONSTRAINT "GeneratedDocument_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GeneratedDocument" ADD CONSTRAINT "GeneratedDocument_generatedBy_fkey" FOREIGN KEY ("generatedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffectedDocument" ADD CONSTRAINT "AffectedDocument_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffectedDocument" ADD CONSTRAINT "AffectedDocument_generatedDocumentId_fkey" FOREIGN KEY ("generatedDocumentId") REFERENCES "GeneratedDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffectedDocument" ADD CONSTRAINT "AffectedDocument_componentChangeLogId_fkey" FOREIGN KEY ("componentChangeLogId") REFERENCES "ComponentChangeLog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AffectedDocument" ADD CONSTRAINT "AffectedDocument_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
