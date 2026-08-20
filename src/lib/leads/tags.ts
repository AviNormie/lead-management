import { prisma } from "@/lib/db/prisma";
import { parseTagNames } from "@/lib/validations/leads";

export async function syncLeadTags(
  organizationId: string,
  leadId: string,
  tagsValue?: string | null,
) {
  const names = parseTagNames(tagsValue);
  await prisma.leadTagOnLead.deleteMany({ where: { leadId } });
  if (names.length === 0) return;

  for (const name of names) {
    const tag = await prisma.leadTag.upsert({
      where: { organizationId_name: { organizationId, name } },
      update: {},
      create: { organizationId, name },
    });
    await prisma.leadTagOnLead.create({
      data: { leadId, tagId: tag.id },
    });
  }
}
