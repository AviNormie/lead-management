"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/tenant";
import { isAppError } from "@/lib/errors";
import { recordActivity } from "@/lib/leads/activity";
import { LEAD_ACTIVITY_TYPES } from "@/lib/leads/activity-types";
import { leadVisibilityWhere } from "@/features/leads/scope";
import type { ActionResult } from "@/features/auth/types";

export async function transferLeadAction(
  leadId: string,
  toUserId: string,
  reason?: string,
): Promise<ActionResult> {
  try {
    const tenant = await requirePermission("lead.transfer");
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, ...leadVisibilityWhere(tenant), archivedAt: null },
    });
    if (!lead) return { ok: false, error: "Lead not found" };

    const toUser = await prisma.organizationMember.findFirst({
      where: {
        organizationId: tenant.organizationId,
        userId: toUserId,
        status: "ACTIVE",
      },
    });
    if (!toUser) return { ok: false, error: "Assignee not found" };

    await prisma.$transaction([
      prisma.leadTransfer.create({
        data: {
          organizationId: tenant.organizationId,
          leadId,
          fromUserId: lead.assignedUserId,
          toUserId,
          reason: reason?.trim() || null,
          transferredById: tenant.userId,
        },
      }),
      prisma.lead.update({
        where: { id: leadId },
        data: { assignedUserId: toUserId },
      }),
    ]);

    await recordActivity({
      organizationId: tenant.organizationId,
      leadId,
      actorId: tenant.userId,
      type: LEAD_ACTIVITY_TYPES.TRANSFERRED,
      message: reason?.trim()
        ? `Lead transferred: ${reason.trim()}`
        : "Lead transferred",
      previous: { assignedUserId: lead.assignedUserId },
      next: { assignedUserId: toUserId, reason: reason?.trim() ?? null },
    });

    revalidatePath(`/leads/${leadId}`);
    revalidatePath("/leads");
    return { ok: true, message: "Lead transferred" };
  } catch (error) {
    if (isAppError(error)) {
      return { ok: false, error: error.message, code: error.code };
    }
    return { ok: false, error: "Transfer failed" };
  }
}

export async function bulkTransferAction(formData: FormData): Promise<ActionResult> {
  try {
    const tenant = await requirePermission("lead.transfer");
    const toUserId = String(formData.get("toUserId") ?? "").trim();
    const reason = String(formData.get("reason") ?? "").trim();
    const ids = String(formData.get("leadIds") ?? "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);

    if (!toUserId) return { ok: false, error: "Select an assignee" };
    if (ids.length === 0) return { ok: false, error: "Select at least one lead" };

    const leads = await prisma.lead.findMany({
      where: {
        id: { in: ids },
        ...leadVisibilityWhere(tenant),
        archivedAt: null,
      },
      select: { id: true, assignedUserId: true },
    });

    if (leads.length === 0) return { ok: false, error: "No matching leads" };

    await prisma.$transaction(
      leads.flatMap((lead) => [
        prisma.leadTransfer.create({
          data: {
            organizationId: tenant.organizationId,
            leadId: lead.id,
            fromUserId: lead.assignedUserId,
            toUserId,
            reason: reason || null,
            transferredById: tenant.userId,
          },
        }),
        prisma.lead.update({
          where: { id: lead.id },
          data: { assignedUserId: toUserId },
        }),
      ]),
    );

    for (const lead of leads) {
      await recordActivity({
        organizationId: tenant.organizationId,
        leadId: lead.id,
        actorId: tenant.userId,
        type: LEAD_ACTIVITY_TYPES.TRANSFERRED,
        message: reason ? `Bulk transfer: ${reason}` : "Bulk transfer",
        previous: { assignedUserId: lead.assignedUserId },
        next: { assignedUserId: toUserId },
      });
    }

    revalidatePath("/leads");
    return { ok: true, message: `${leads.length} lead(s) transferred` };
  } catch (error) {
    if (isAppError(error)) {
      return { ok: false, error: error.message, code: error.code };
    }
    return { ok: false, error: "Bulk transfer failed" };
  }
}
