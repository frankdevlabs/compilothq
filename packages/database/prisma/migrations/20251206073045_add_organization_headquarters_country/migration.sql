-- AlterTable
ALTER TABLE "Organization" ADD COLUMN     "headquartersCountryId" TEXT;

-- CreateIndex
CREATE INDEX "Organization_headquartersCountryId_idx" ON "Organization"("headquartersCountryId");

-- AddForeignKey
ALTER TABLE "Organization" ADD CONSTRAINT "Organization_headquartersCountryId_fkey" FOREIGN KEY ("headquartersCountryId") REFERENCES "Country"("id") ON DELETE SET NULL ON UPDATE CASCADE;
