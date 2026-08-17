"use server";

import { revalidatePath } from "next/cache";
import { FollowUpType, LeadPriority, TaskStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/tenant";
import { isAppError } from "@/lib/errors";
import type { ActionResult } from "@/features/auth/actions";
import { followUpSchema, noteSchema, taskSchema } from "@/lib/validations/leads";
import { recordActivity } from "@/lib/leads/activity";

export async function addNoteAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const tenant = await requirePermission("lead.edit");
    const leadId = String(formData.get("leadId") ?? "");
    const parsed = noteSchema.safeParse({ content: formData.get("content") });
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid" };
    }
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, organizationId: tenant.organizationId },
    });
    if (!lead) return { ok: false, error: "Lead not found" };

    await prisma.leadNote.create({
      data: {
        organizationId: tenant.organizationId,
        leadId,
        authorId: tenant.userId,
        content: parsed.data.content,
      },
    });
    await recordActivity({
      organizationId: tenant.organizationId,
      leadId,
      actorId: tenant.userId,
      type: "NOTE_ADDED",
      message: "Note added",
    });
    revalidatePath(`/leads/${leadId}`);
    return { ok: true };
  } catch (error) {
    if (isAppError(error)) return { ok: false, error: error.message, code: error.code };
    return { ok: false, error: "Failed to add note" };
  }
}

export async function createTaskAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const tenant = await requirePermission("lead.edit");
    const leadId = String(formData.get("leadId") ?? "");
    const parsed = taskSchema.safeParse({
      title: formData.get("title"),
      description: formData.get("description") || undefined,
      assignedUserId: formData.get("assignedUserId") || "",
      dueDate: formData.get("dueDate") || undefined,
      priority: formData.get("priority") || undefined,
    });
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid" };
    }
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, organizationId: tenant.organizationId },
    });
    if (!lead) return { ok: false, error: "Lead not found" };

    await prisma.leadTask.create({
      data: {
        organizationId: tenant.organizationId,
        leadId,
        title: parsed.data.title,
        description: parsed.data.description,
        assignedUserId: parsed.data.assignedUserId || tenant.userId,
        dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : null,
        priority: parsed.data.priority ?? LeadPriority.MEDIUM,
      },
    });
    await recordActivity({
      organizationId: tenant.organizationId,
      leadId,
      actorId: tenant.userId,
      type: "TASK_CREATED",
      message: `Task created: ${parsed.data.title}`,
    });
    revalidatePath(`/leads/${leadId}`);
    revalidatePath("/leads/tasks");
    return { ok: true };
  } catch (error) {
    if (isAppError(error)) return { ok: false, error: error.message, code: error.code };
    return { ok: false, error: "Failed to create task" };
  }
}

export async function completeTaskAction(formData: FormData): Promise<void> {
  const tenant = await requirePermission("lead.edit");
  const taskId = String(formData.get("taskId") ?? "");
  const task = await prisma.leadTask.findFirst({
    where: { id: taskId, organizationId: tenant.organizationId },
  });
  if (!task) return;
  await prisma.leadTask.update({
    where: { id: taskId },
    data: { status: TaskStatus.COMPLETED },
  });
  revalidatePath(`/leads/${task.leadId}`);
  revalidatePath("/leads/tasks");
}

export async function createFollowUpAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const tenant = await requirePermission("lead.edit");
    const leadId = String(formData.get("leadId") ?? "");
    const parsed = followUpSchema.safeParse({
      title: formData.get("title"),
      description: formData.get("description") || undefined,
      type: formData.get("type") || FollowUpType.CALL,
      dueAt: formData.get("dueAt"),
      assignedUserId: formData.get("assignedUserId") || "",
      priority: formData.get("priority") || undefined,
    });
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid" };
    }
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, organizationId: tenant.organizationId },
    });
    if (!lead) return { ok: false, error: "Lead not found" };

    const dueAt = new Date(parsed.data.dueAt);
    await prisma.leadFollowUp.create({
      data: {
        organizationId: tenant.organizationId,
        leadId,
        title: parsed.data.title,
        description: parsed.data.description,
        type: parsed.data.type ?? FollowUpType.CALL,
        dueAt,
        assignedUserId: parsed.data.assignedUserId || tenant.userId,
        priority: parsed.data.priority ?? LeadPriority.MEDIUM,
      },
    });
    await prisma.lead.update({
      where: { id: leadId },
      data: { nextFollowUpAt: dueAt },
    });
    await recordActivity({
      organizationId: tenant.organizationId,
      leadId,
      actorId: tenant.userId,
      type: "FOLLOW_UP_CREATED",
      message: `Follow-up scheduled: ${parsed.data.title}`,
    });
    revalidatePath(`/leads/${leadId}`);
    revalidatePath("/leads/follow-ups");
    return { ok: true };
  } catch (error) {
    if (isAppError(error)) return { ok: false, error: error.message, code: error.code };
    return { ok: false, error: "Failed to schedule follow-up" };
  }
}

export async function completeFollowUpAction(
  formData: FormData,
): Promise<void> {
  const tenant = await requirePermission("lead.edit");
  const followUpId = String(formData.get("followUpId") ?? "");
  const item = await prisma.leadFollowUp.findFirst({
    where: { id: followUpId, organizationId: tenant.organizationId },
  });
  if (!item) return;

  await prisma.leadFollowUp.update({
    where: { id: followUpId },
    data: { status: TaskStatus.COMPLETED },
  });
  await prisma.lead.update({
    where: { id: item.leadId },
    data: { lastContactedAt: new Date() },
  });
  await recordActivity({
    organizationId: tenant.organizationId,
    leadId: item.leadId,
    actorId: tenant.userId,
    type: "FOLLOW_UP_COMPLETED",
    message: `Follow-up completed: ${item.title}`,
  });
  revalidatePath(`/leads/${item.leadId}`);
  revalidatePath("/leads/follow-ups");
  revalidatePath("/dashboard");
}
