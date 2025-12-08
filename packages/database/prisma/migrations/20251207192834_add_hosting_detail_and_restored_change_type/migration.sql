-- AlterEnum
ALTER TYPE "ChangeType" ADD VALUE 'RESTORED';

-- AlterTable
ALTER TABLE "DigitalAsset" ADD COLUMN     "hostingDetail" TEXT;
