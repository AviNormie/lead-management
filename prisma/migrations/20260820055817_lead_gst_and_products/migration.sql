-- AlterTable
ALTER TABLE "leads" ADD COLUMN     "gstNo" TEXT,
ADD COLUMN     "productId" TEXT;

-- CreateTable
CREATE TABLE "lead_products" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lead_products_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lead_products_organizationId_idx" ON "lead_products"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "lead_products_organizationId_code_key" ON "lead_products"("organizationId", "code");

-- CreateIndex
CREATE INDEX "leads_organizationId_productId_idx" ON "leads"("organizationId", "productId");

-- AddForeignKey
ALTER TABLE "lead_products" ADD CONSTRAINT "lead_products_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "leads" ADD CONSTRAINT "leads_productId_fkey" FOREIGN KEY ("productId") REFERENCES "lead_products"("id") ON DELETE SET NULL ON UPDATE CASCADE;
