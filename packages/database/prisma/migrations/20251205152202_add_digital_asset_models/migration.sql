-- CreateEnum
CREATE TYPE "AssetType" AS ENUM ('ANALYTICS_PLATFORM', 'API', 'APPLICATION', 'CLOUD_SERVICE', 'CRM', 'DATABASE', 'ERP', 'FILE_STORAGE', 'MARKETING_TOOL', 'ON_PREMISE_SYSTEM', 'OTHER');

-- CreateEnum
CREATE TYPE "IntegrationStatus" AS ENUM ('CONNECTED', 'FAILED', 'MANUAL_ONLY', 'NOT_INTEGRATED', 'PENDING');

-- CreateEnum
CREATE TYPE "LocationRole" AS ENUM ('HOSTING', 'PROCESSING', 'BOTH');

-- CreateTable
CREATE TABLE "DigitalAsset" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AssetType" NOT NULL,
    "description" TEXT,
    "primaryHostingCountryId" TEXT,
    "url" TEXT,
    "technicalOwnerId" TEXT,
    "businessOwnerId" TEXT,
    "containsPersonalData" BOOLEAN NOT NULL DEFAULT false,
    "integrationStatus" "IntegrationStatus" NOT NULL DEFAULT 'NOT_INTEGRATED',
    "lastScannedAt" TIMESTAMP(3),
    "discoveredVia" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DigitalAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataProcessingActivityDigitalAsset" (
    "id" TEXT NOT NULL,
    "activityId" TEXT NOT NULL,
    "digitalAssetId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DataProcessingActivityDigitalAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssetProcessingLocation" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "digitalAssetId" TEXT NOT NULL,
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

    CONSTRAINT "AssetProcessingLocation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DigitalAsset_organizationId_idx" ON "DigitalAsset"("organizationId");

-- CreateIndex
CREATE INDEX "DigitalAsset_organizationId_containsPersonalData_idx" ON "DigitalAsset"("organizationId", "containsPersonalData");

-- CreateIndex
CREATE INDEX "DigitalAsset_organizationId_type_idx" ON "DigitalAsset"("organizationId", "type");

-- CreateIndex
CREATE INDEX "DigitalAsset_organizationId_primaryHostingCountryId_idx" ON "DigitalAsset"("organizationId", "primaryHostingCountryId");

-- CreateIndex
CREATE INDEX "DataProcessingActivityDigitalAsset_activityId_idx" ON "DataProcessingActivityDigitalAsset"("activityId");

-- CreateIndex
CREATE INDEX "DataProcessingActivityDigitalAsset_digitalAssetId_idx" ON "DataProcessingActivityDigitalAsset"("digitalAssetId");

-- CreateIndex
CREATE UNIQUE INDEX "DataProcessingActivityDigitalAsset_activityId_digitalAssetI_key" ON "DataProcessingActivityDigitalAsset"("activityId", "digitalAssetId");

-- CreateIndex
CREATE INDEX "AssetProcessingLocation_organizationId_digitalAssetId_idx" ON "AssetProcessingLocation"("organizationId", "digitalAssetId");

-- CreateIndex
CREATE INDEX "AssetProcessingLocation_organizationId_countryId_idx" ON "AssetProcessingLocation"("organizationId", "countryId");

-- CreateIndex
CREATE INDEX "AssetProcessingLocation_organizationId_transferMechanismId_idx" ON "AssetProcessingLocation"("organizationId", "transferMechanismId");

-- AddForeignKey
ALTER TABLE "DigitalAsset" ADD CONSTRAINT "DigitalAsset_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DigitalAsset" ADD CONSTRAINT "DigitalAsset_primaryHostingCountryId_fkey" FOREIGN KEY ("primaryHostingCountryId") REFERENCES "Country"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DigitalAsset" ADD CONSTRAINT "DigitalAsset_technicalOwnerId_fkey" FOREIGN KEY ("technicalOwnerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DigitalAsset" ADD CONSTRAINT "DigitalAsset_businessOwnerId_fkey" FOREIGN KEY ("businessOwnerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataProcessingActivityDigitalAsset" ADD CONSTRAINT "DataProcessingActivityDigitalAsset_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "DataProcessingActivity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataProcessingActivityDigitalAsset" ADD CONSTRAINT "DataProcessingActivityDigitalAsset_digitalAssetId_fkey" FOREIGN KEY ("digitalAssetId") REFERENCES "DigitalAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetProcessingLocation" ADD CONSTRAINT "AssetProcessingLocation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetProcessingLocation" ADD CONSTRAINT "AssetProcessingLocation_digitalAssetId_fkey" FOREIGN KEY ("digitalAssetId") REFERENCES "DigitalAsset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetProcessingLocation" ADD CONSTRAINT "AssetProcessingLocation_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetProcessingLocation" ADD CONSTRAINT "AssetProcessingLocation_purposeId_fkey" FOREIGN KEY ("purposeId") REFERENCES "Purpose"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssetProcessingLocation" ADD CONSTRAINT "AssetProcessingLocation_transferMechanismId_fkey" FOREIGN KEY ("transferMechanismId") REFERENCES "TransferMechanism"("id") ON DELETE SET NULL ON UPDATE CASCADE;
