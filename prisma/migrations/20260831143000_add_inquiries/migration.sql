-- CreateEnum
CREATE TYPE "InquiryStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- CreateTable
CREATE TABLE "inquiries" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT,
    "contactName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "status" "InquiryStatus" NOT NULL DEFAULT 'OPEN',
    "priority" "LeadPriority" NOT NULL DEFAULT 'MEDIUM',
    "assignedUserId" UUID,
    "linkedLeadId" TEXT,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inquiries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "inquiries_organizationId_idx" ON "inquiries"("organizationId");

-- CreateIndex
CREATE INDEX "inquiries_organizationId_status_idx" ON "inquiries"("organizationId", "status");

-- CreateIndex
CREATE INDEX "inquiries_organizationId_assignedUserId_idx" ON "inquiries"("organizationId", "assignedUserId");

-- CreateIndex
CREATE INDEX "inquiries_organizationId_createdAt_idx" ON "inquiries"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "inquiries_organizationId_priority_idx" ON "inquiries"("organizationId", "priority");

-- AddForeignKey
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_linkedLeadId_fkey" FOREIGN KEY ("linkedLeadId") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;
