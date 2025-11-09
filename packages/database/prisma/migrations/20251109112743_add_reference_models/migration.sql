-- CreateEnum
CREATE TYPE "DataNatureType" AS ENUM ('SPECIAL', 'NON_SPECIAL');

-- CreateEnum
CREATE TYPE "TransferMechanismCategory" AS ENUM ('ADEQUACY', 'SAFEGUARD', 'DEROGATION', 'NONE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Country" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isoCode" TEXT NOT NULL,
    "isoCode3" TEXT,
    "gdprStatus" JSONB NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Country_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataNature" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" "DataNatureType" NOT NULL,
    "gdprArticle" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DataNature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProcessingAct" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "examples" JSONB NOT NULL,
    "requiresDPA" BOOLEAN NOT NULL DEFAULT false,
    "triggersDPIA" BOOLEAN NOT NULL DEFAULT false,
    "gdprArticle" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProcessingAct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransferMechanism" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "typicalUseCase" TEXT NOT NULL,
    "gdprArticle" TEXT NOT NULL,
    "category" "TransferMechanismCategory" NOT NULL,
    "isDerogation" BOOLEAN NOT NULL,
    "requiresAdequacy" BOOLEAN NOT NULL,
    "requiresDocumentation" BOOLEAN NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransferMechanism_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecipientCategory" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "examples" JSONB NOT NULL,
    "commonReasons" TEXT NOT NULL,
    "requiresDPA" BOOLEAN NOT NULL DEFAULT false,
    "requiresImpactAssessment" BOOLEAN NOT NULL DEFAULT false,
    "defaultRole" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecipientCategory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Country_isoCode_key" ON "Country"("isoCode");

-- CreateIndex
CREATE UNIQUE INDEX "Country_isoCode3_key" ON "Country"("isoCode3");

-- CreateIndex
CREATE INDEX "Country_name_idx" ON "Country"("name");

-- CreateIndex
CREATE INDEX "Country_isoCode_idx" ON "Country"("isoCode");

-- CreateIndex
CREATE INDEX "DataNature_name_idx" ON "DataNature"("name");

-- CreateIndex
CREATE INDEX "DataNature_type_idx" ON "DataNature"("type");

-- CreateIndex
CREATE INDEX "ProcessingAct_name_idx" ON "ProcessingAct"("name");

-- CreateIndex
CREATE UNIQUE INDEX "TransferMechanism_code_key" ON "TransferMechanism"("code");

-- CreateIndex
CREATE INDEX "TransferMechanism_name_idx" ON "TransferMechanism"("name");

-- CreateIndex
CREATE INDEX "TransferMechanism_category_idx" ON "TransferMechanism"("category");

-- CreateIndex
CREATE UNIQUE INDEX "RecipientCategory_code_key" ON "RecipientCategory"("code");

-- CreateIndex
CREATE INDEX "RecipientCategory_name_idx" ON "RecipientCategory"("name");
