"use server";

import { revalidatePath } from "next/cache";
import { LeadPriority, LeadStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/tenant";
import { isAppError } from "@/lib/errors";
import type { ActionResult } from "@/features/auth/actions";
import { computeFullName, leadFormSchema } from "@/lib/validations/leads";
import { findDuplicateLeads, type DuplicateMatch } from "@/lib/leads/duplicates";
import { recordActivity } from "@/lib/leads/activity";

export type LeadActionResult =
  | { ok: true; message?: string; leadId?: string }
  | {
      ok: false;
      error: string;
      code?: string;
      duplicates?: DuplicateMatch[];
    };

function formString(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value.length ? value : undefined;
}

function leadPayload(formData: FormData) {
  return leadFormSchema.parse({
    firstName: formString(formData, "firstName"),
    lastName: formString(formData, "lastName"),
    company: formString(formData, "company"),
    email: formString(formData, "email") ?? "",
    phone: formString(formData, "phone"),
    alternatePhone: formString(formData, "alternatePhone"),
    whatsappNumber: formString(formData, "whatsappNumber"),
    website: formString(formData, "website"),
    city: formString(formData, "city"),
    state: formString(formData, "state"),
    country: formString(formData, "country"),
    industry: formString(formData, "industry"),
    jobTitle: formString(formData, "jobTitle"),
    companySize: formString(formData, "companySize"),
    requirement: formString(formData, "requirement"),
    productInterest: formString(formData, "productInterest"),
    expectedValue: formString(formData, "expectedValue")
      ? Number(formData.get("expectedValue"))
      : undefined,
    budget: formString(formData, "budget"),
    purchaseTimeline: formString(formData, "purchaseTimeline"),
    sourceId: formString(formData, "sourceId"),
    sourceDetail: formString(formData, "sourceDetail"),
    campaign: formString(formData, "campaign"),
    status: formString(formData, "status"),
    stageId: formString(formData, "stageId"),
    pipelineId: formString(formData, "pipelineId"),
    priority: formString(formData, "priority"),
    assignedUserId: formString(formData, "assignedUserId") ?? "",
    description: formString(formData, "description"),
    forceCreate: formData.get("forceCreate") === "true",
  });
}

async function resolvePipeline(
  organizationId: string,
  stageId?: string,
  pipelineId?: string,
) {
  if (pipelineId) return pipelineId;
  if (stageId) {
    const stage = await prisma.leadStage.findFirst({
      where: { id: stageId, organizationId },
    });
    return stage?.pipelineId;
  }
  const def = await prisma.pipeline.findFirst({
    where: { organizationId, isDefault: true },
  });
  return def?.id;
}

export async function createLeadAction(
  _prev: LeadActionResult | null,
  formData: FormData,
): Promise<LeadActionResult> {
  try {
    const tenant = await requirePermission("lead.create");
    const data = leadPayload(formData);
    const email = data.email || null;

    const duplicates = await findDuplicateLeads(tenant.organizationId, {
      email,
      phone: data.phone,
      whatsappNumber: data.whatsappNumber,
      company: data.company,
    });
    if (duplicates.length > 0 && !data.forceCreate) {
      return {
        ok: false,
        error: "Possible duplicates found. Confirm to create anyway.",
        code: "DUPLICATE",
        duplicates,
      };
    }

    const pipelineId = await resolvePipeline(
      tenant.organizationId,
      data.stageId,
      data.pipelineId,
    );
    const fullName = computeFullName(data);

    const lead = await prisma.lead.create({
      data: {
        organizationId: tenant.organizationId,
        firstName: data.firstName,
        lastName: data.lastName,
        fullName,
        company: data.company,
        email,
        phone: data.phone,
        alternatePhone: data.alternatePhone,
        whatsappNumber: data.whatsappNumber,
        website: data.website,
        city: data.city,
        state: data.state,
        country: data.country,
        industry: data.industry,
        jobTitle: data.jobTitle,
        companySize: data.companySize,
        requirement: data.requirement,
        productInterest: data.productInterest,
        expectedValue: data.expectedValue,
        budget: data.budget,
        purchaseTimeline: data.purchaseTimeline,
        sourceId: data.sourceId,
        sourceDetail: data.sourceDetail,
        campaign: data.campaign,
        status: data.status ?? LeadStatus.NEW,
        stageId: data.stageId,
        pipelineId,
        priority: data.priority ?? LeadPriority.MEDIUM,
        assignedUserId: data.assignedUserId || null,
        description: data.description,
      },
    });

    await recordActivity({
      organizationId: tenant.organizationId,
      leadId: lead.id,
      actorId: tenant.userId,
      type: "CREATED",
      message: `Lead created: ${fullName}`,
    });

    if (lead.assignedUserId) {
      await recordActivity({
        organizationId: tenant.organizationId,
        leadId: lead.id,
        actorId: tenant.userId,
        type: "ASSIGNED",
        message: "Lead assigned",
        next: { assignedUserId: lead.assignedUserId },
      });
    }

    revalidatePath("/leads");
    revalidatePath("/dashboard");
    return { ok: true, leadId: lead.id };
  } catch (error) {
    if (isAppError(error)) {
      return { ok: false, error: error.message, code: error.code };
    }
    console.error(error);
    return { ok: false, error: "Failed to create lead" };
  }
}

export async function updateLeadAction(
  _prev: LeadActionResult | null,
  formData: FormData,
): Promise<LeadActionResult> {
  try {
    const tenant = await requirePermission("lead.edit");
    const leadId = String(formData.get("leadId") ?? "");
    const existing = await prisma.lead.findFirst({
      where: { id: leadId, organizationId: tenant.organizationId },
    });
    if (!existing) {
      return { ok: false, error: "Lead not found" };
    }

    const data = leadPayload(formData);
    const email = data.email || null;
    const fullName = computeFullName(data);
    const pipelineId = await resolvePipeline(
      tenant.organizationId,
      data.stageId,
      data.pipelineId,
    );

    await prisma.lead.update({
      where: { id: leadId },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        fullName,
        company: data.company,
        email,
        phone: data.phone,
        alternatePhone: data.alternatePhone,
        whatsappNumber: data.whatsappNumber,
        website: data.website,
        city: data.city,
        state: data.state,
        country: data.country,
        industry: data.industry,
        jobTitle: data.jobTitle,
        companySize: data.companySize,
        requirement: data.requirement,
        productInterest: data.productInterest,
        expectedValue: data.expectedValue,
        budget: data.budget,
        purchaseTimeline: data.purchaseTimeline,
        sourceId: data.sourceId,
        sourceDetail: data.sourceDetail,
        campaign: data.campaign,
        priority: data.priority ?? existing.priority,
        assignedUserId: data.assignedUserId || null,
        description: data.description,
        pipelineId,
        stageId: data.stageId,
      },
    });

    await recordActivity({
      organizationId: tenant.organizationId,
      leadId,
      actorId: tenant.userId,
      type: "UPDATED",
      message: "Lead details updated",
    });

    revalidatePath(`/leads/${leadId}`);
    revalidatePath("/leads");
    return { ok: true, leadId };
  } catch (error) {
    if (isAppError(error)) {
      return { ok: false, error: error.message, code: error.code };
    }
    console.error(error);
    return { ok: false, error: "Failed to update lead" };
  }
}

export async function archiveLeadAction(leadId: string): Promise<ActionResult> {
  try {
    const tenant = await requirePermission("lead.delete");
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, organizationId: tenant.organizationId },
    });
    if (!lead) return { ok: false, error: "Lead not found" };

    await prisma.lead.update({
      where: { id: leadId },
      data: { archivedAt: new Date() },
    });
    revalidatePath("/leads");
    return { ok: true };
  } catch (error) {
    if (isAppError(error)) {
      return { ok: false, error: error.message, code: error.code };
    }
    return { ok: false, error: "Failed to archive lead" };
  }
}

export async function assignLeadAction(
  leadId: string,
  assignedUserId: string | null,
): Promise<ActionResult> {
  try {
    const tenant = await requirePermission("lead.assign");
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, organizationId: tenant.organizationId },
    });
    if (!lead) return { ok: false, error: "Lead not found" };

    await prisma.lead.update({
      where: { id: leadId },
      data: { assignedUserId },
    });
    await recordActivity({
      organizationId: tenant.organizationId,
      leadId,
      actorId: tenant.userId,
      type: "ASSIGNED",
      message: assignedUserId ? "Lead assignment changed" : "Lead unassigned",
      previous: { assignedUserId: lead.assignedUserId },
      next: { assignedUserId },
    });
    revalidatePath(`/leads/${leadId}`);
    return { ok: true };
  } catch (error) {
    if (isAppError(error)) {
      return { ok: false, error: error.message, code: error.code };
    }
    return { ok: false, error: "Failed to assign lead" };
  }
}

export async function changeLeadStageAction(
  leadId: string,
  stageId: string,
): Promise<ActionResult> {
  try {
    const tenant = await requirePermission("lead.change_stage");
    const [lead, stage] = await Promise.all([
      prisma.lead.findFirst({
        where: { id: leadId, organizationId: tenant.organizationId },
      }),
      prisma.leadStage.findFirst({
        where: { id: stageId, organizationId: tenant.organizationId },
      }),
    ]);
    if (!lead || !stage) return { ok: false, error: "Lead or stage not found" };

    let status: LeadStatus | undefined;
    if (stage.isWon) status = LeadStatus.CONVERTED;
    if (stage.isLost) status = LeadStatus.LOST;

    await prisma.lead.update({
      where: { id: leadId },
      data: {
        stageId: stage.id,
        pipelineId: stage.pipelineId,
        ...(status
          ? {
              status,
              convertedAt: status === "CONVERTED" ? new Date() : lead.convertedAt,
            }
          : {}),
      },
    });
    await recordActivity({
      organizationId: tenant.organizationId,
      leadId,
      actorId: tenant.userId,
      type: "STAGE_CHANGED",
      message: `Stage changed to ${stage.name}`,
      previous: { stageId: lead.stageId },
      next: { stageId: stage.id },
    });
    revalidatePath(`/leads/${leadId}`);
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (error) {
    if (isAppError(error)) {
      return { ok: false, error: error.message, code: error.code };
    }
    return { ok: false, error: "Failed to change stage" };
  }
}

export async function changeLeadStatusAction(
  leadId: string,
  status: LeadStatus,
  lostReason?: string,
): Promise<ActionResult> {
  try {
    const tenant = await requirePermission("lead.edit");
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, organizationId: tenant.organizationId },
    });
    if (!lead) return { ok: false, error: "Lead not found" };

    if (status === "CONVERTED") {
      await requirePermission("lead.convert");
    }

    await prisma.lead.update({
      where: { id: leadId },
      data: {
        status,
        lostReason: status === "LOST" ? lostReason : null,
        convertedAt: status === "CONVERTED" ? new Date() : lead.convertedAt,
      },
    });
    await recordActivity({
      organizationId: tenant.organizationId,
      leadId,
      actorId: tenant.userId,
      type: status === "LOST" ? "MARKED_LOST" : "STATUS_CHANGED",
      message:
        status === "LOST"
          ? `Lead marked lost${lostReason ? `: ${lostReason}` : ""}`
          : `Status changed to ${status}`,
      previous: { status: lead.status },
      next: { status },
    });
    revalidatePath(`/leads/${leadId}`);
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (error) {
    if (isAppError(error)) {
      return { ok: false, error: error.message, code: error.code };
    }
    return { ok: false, error: "Failed to update status" };
  }
}
