-- AlterEnum
ALTER TYPE "FollowUpType" ADD VALUE 'OTHER';

-- AlterTable
ALTER TABLE "leads" ADD COLUMN     "address" TEXT,
ADD COLUMN     "postalCode" TEXT;

-- AlterTable
ALTER TABLE "pipelines" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;
