import type { Prisma, PrismaClient } from "@prisma/client";

type DbClient = PrismaClient | Prisma.TransactionClient;

export const DEFAULT_LEAD_SOURCES = [
  { code: "website", name: "Website" },
  { code: "manual", name: "Manual entry" },
  { code: "import", name: "Import" },
  { code: "instagram", name: "Instagram" },
  { code: "facebook", name: "Facebook" },
  { code: "whatsapp", name: "WhatsApp" },
  { code: "linkedin", name: "LinkedIn" },
  { code: "google", name: "Google" },
  { code: "pinterest", name: "Pinterest" },
  { code: "other_social", name: "Other social media" },
  { code: "search", name: "Search engines" },
  { code: "referral", name: "Referral" },
  { code: "campaign", name: "Campaign" },
  { code: "other", name: "Other" },
] as const;

export const DEFAULT_STAGES = [
  { name: "New", sortOrder: 0, probability: 10, color: "#2F6BFF", isWon: false, isLost: false },
  { name: "Contacted", sortOrder: 1, probability: 25, color: "#7C5CFF", isWon: false, isLost: false },
  { name: "Qualified", sortOrder: 2, probability: 50, color: "#2EC4B6", isWon: false, isLost: false },
  { name: "Proposal", sortOrder: 3, probability: 70, color: "#FF8A3D", isWon: false, isLost: false },
  { name: "Negotiation", sortOrder: 4, probability: 85, color: "#F5C542", isWon: false, isLost: false },
  { name: "Won", sortOrder: 5, probability: 100, color: "#16A34A", isWon: true, isLost: false },
  { name: "Lost", sortOrder: 6, probability: 0, color: "#EF4444", isWon: false, isLost: true },
] as const;

export async function seedOrganizationLeadDefaults(
  db: DbClient,
  organizationId: string,
) {
  await db.leadSource.createMany({
    data: DEFAULT_LEAD_SOURCES.map((source) => ({
      organizationId,
      code: source.code,
      name: source.name,
      isSystem: true,
    })),
    skipDuplicates: true,
  });

  const pipeline = await db.pipeline.create({
    data: {
      organizationId,
      name: "Default",
      isDefault: true,
    },
  });

  await db.leadStage.createMany({
    data: DEFAULT_STAGES.map((stage) => ({
      organizationId,
      pipelineId: pipeline.id,
      name: stage.name,
      sortOrder: stage.sortOrder,
      probability: stage.probability,
      color: stage.color,
      isWon: stage.isWon,
      isLost: stage.isLost,
    })),
  });

  return pipeline.id;
}
