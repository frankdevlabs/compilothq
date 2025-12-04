/*
  Warnings:

  - Added the required column `organizationId` to the `Agreement` table without a default value. This is not possible if the table is not empty.
  - Added the required column `organizationId` to the `ExternalOrganization` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Agreement_expiryDate_idx";

-- DropIndex
DROP INDEX "Agreement_status_idx";

-- DropIndex
DROP INDEX "Agreement_type_idx";

-- DropIndex
DROP INDEX "ExternalOrganization_legalName_idx";

-- DropIndex
DROP INDEX "ExternalOrganization_tradingName_idx";

-- AlterTable
ALTER TABLE "Agreement" ADD COLUMN     "organizationId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ExternalOrganization" ADD COLUMN     "organizationId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Recipient" RENAME CONSTRAINT "Processor_pkey" TO "Recipient_pkey";

-- CreateIndex
CREATE INDEX "Agreement_organizationId_idx" ON "Agreement"("organizationId");

-- CreateIndex
CREATE INDEX "Agreement_organizationId_externalOrganizationId_idx" ON "Agreement"("organizationId", "externalOrganizationId");

-- CreateIndex
CREATE INDEX "Agreement_organizationId_type_idx" ON "Agreement"("organizationId", "type");

-- CreateIndex
CREATE INDEX "Agreement_organizationId_status_idx" ON "Agreement"("organizationId", "status");

-- CreateIndex
CREATE INDEX "Agreement_organizationId_expiryDate_idx" ON "Agreement"("organizationId", "expiryDate");

-- CreateIndex
CREATE INDEX "ExternalOrganization_organizationId_idx" ON "ExternalOrganization"("organizationId");

-- CreateIndex
CREATE INDEX "ExternalOrganization_organizationId_legalName_idx" ON "ExternalOrganization"("organizationId", "legalName");

-- CreateIndex
CREATE INDEX "ExternalOrganization_organizationId_tradingName_idx" ON "ExternalOrganization"("organizationId", "tradingName");

-- AddForeignKey
ALTER TABLE "ExternalOrganization" ADD CONSTRAINT "ExternalOrganization_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Agreement" ADD CONSTRAINT "Agreement_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
