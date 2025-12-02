-- CreateEnum
CREATE TYPE "SensitivityLevel" AS ENUM ('PUBLIC', 'INTERNAL', 'CONFIDENTIAL', 'RESTRICTED');

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

-- AddForeignKey
ALTER TABLE "DataCategory" ADD CONSTRAINT "DataCategory_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataCategoryDataNature" ADD CONSTRAINT "DataCategoryDataNature_dataCategoryId_fkey" FOREIGN KEY ("dataCategoryId") REFERENCES "DataCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataCategoryDataNature" ADD CONSTRAINT "DataCategoryDataNature_dataNatureId_fkey" FOREIGN KEY ("dataNatureId") REFERENCES "DataNature"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
