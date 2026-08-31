import { prisma } from "@/lib/db/prisma";

/** Recalculate lead.nextFollowUpAt from earliest pending follow-up. */
export async function syncLeadNextFollowUpAt(leadId: string) {
  const next = await prisma.leadFollowUp.findFirst({
    where: { leadId, status: "PENDING" },
    orderBy: { dueAt: "asc" },
    select: { dueAt: true },
  });
  await prisma.lead.update({
    where: { id: leadId },
    data: { nextFollowUpAt: next?.dueAt ?? null },
  });
}
