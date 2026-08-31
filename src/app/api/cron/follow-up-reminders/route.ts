import { NextResponse } from "next/server";
import { TaskStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { notifyFollowUpReminder } from "@/lib/email/crm-notify";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorize(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const header = request.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

/**
 * Hourly cron: remind assignees of pending follow-ups due in the next hour
 * (and overdue items that have never been reminded).
 */
export async function GET(request: Request) {
  if (!authorize(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const windowEnd = new Date(now.getTime() + 60 * 60 * 1000);

  const due = await prisma.leadFollowUp.findMany({
    where: {
      status: TaskStatus.PENDING,
      remindedAt: null,
      assignedUserId: { not: null },
      dueAt: { lte: windowEnd },
    },
    include: {
      lead: { select: { id: true, fullName: true } },
      organization: { select: { id: true, name: true } },
    },
    take: 200,
    orderBy: { dueAt: "asc" },
  });

  let sent = 0;
  let failed = 0;

  for (const item of due) {
    if (!item.assignedUserId) continue;
    try {
      await notifyFollowUpReminder({
        organizationId: item.organizationId,
        organizationName: item.organization.name,
        leadId: item.leadId,
        leadName: item.lead.fullName,
        followUpId: item.id,
        title: item.title,
        dueAt: item.dueAt,
        assignedUserId: item.assignedUserId,
      });
      await prisma.leadFollowUp.update({
        where: { id: item.id },
        data: { remindedAt: new Date() },
      });
      sent += 1;
    } catch (error) {
      failed += 1;
      console.error("[cron] follow-up reminder failed", item.id, error);
    }
  }

  return NextResponse.json({
    ok: true,
    checked: due.length,
    sent,
    failed,
    windowEnd: windowEnd.toISOString(),
  });
}
