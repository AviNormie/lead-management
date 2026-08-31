-- AlterTable
ALTER TABLE "lead_follow_ups" ADD COLUMN     "remindedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "lead_follow_ups_status_dueAt_remindedAt_idx" ON "lead_follow_ups"("status", "dueAt", "remindedAt");
