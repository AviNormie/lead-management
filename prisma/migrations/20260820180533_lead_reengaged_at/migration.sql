-- AlterTable
ALTER TABLE "leads" ADD COLUMN     "reEngagedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "leads_organizationId_reEngagedAt_idx" ON "leads"("organizationId", "reEngagedAt");
