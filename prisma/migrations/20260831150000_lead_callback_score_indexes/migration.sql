-- AlterTable
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "callbackAt" TIMESTAMP(3);
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "lastScoreUpdatedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "leads_organizationId_callbackAt_idx" ON "leads"("organizationId", "callbackAt");
CREATE INDEX IF NOT EXISTS "leads_organizationId_nextFollowUpAt_idx" ON "leads"("organizationId", "nextFollowUpAt");
CREATE INDEX IF NOT EXISTS "leads_organizationId_leadScore_idx" ON "leads"("organizationId", "leadScore");
