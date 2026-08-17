import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@prisma/client";

export async function recordActivity(input: {
  organizationId: string;
  leadId: string;
  actorId?: string | null;
  type: string;
  message: string;
  previous?: Prisma.InputJsonValue;
  next?: Prisma.InputJsonValue;
}) {
  await prisma.leadActivity.create({
    data: {
      organizationId: input.organizationId,
      leadId: input.leadId,
      actorId: input.actorId ?? null,
      type: input.type,
      message: input.message,
      previous: input.previous,
      next: input.next,
    },
  });
}
