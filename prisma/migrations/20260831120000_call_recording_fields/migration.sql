-- AlterTable
ALTER TABLE "lead_call_records" ADD COLUMN     "didNumber" TEXT,
ADD COLUMN     "recordingPath" TEXT,
ADD COLUMN     "recordingFileName" TEXT,
ADD COLUMN     "recordingMimeType" TEXT,
ADD COLUMN     "recordingSizeBytes" INTEGER,
ADD COLUMN     "recordingDurationSec" INTEGER;
