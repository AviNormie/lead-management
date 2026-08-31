"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/tenant";
import { isAppError } from "@/lib/errors";
import { inquiryFormSchema } from "@/lib/validations/inquiries";

export type InquiryActionResult =
  | { ok: true; message?: string; inquiryId?: string }
  | { ok: false; error: string; code?: string };

function formString(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value.length ? value : undefined;
}

function inquiryPayload(formData: FormData) {
  return inquiryFormSchema.parse({
    subject: formString(formData, "subject") ?? "",
    description: formString(formData, "description"),
    contactName: formString(formData, "contactName") ?? "",
    email: formString(formData, "email"),
    phone: formString(formData, "phone"),
    status: formString(formData, "status"),
    priority: formString(formData, "priority"),
    assignedUserId: formString(formData, "assignedUserId"),
    linkedLeadId: formString(formData, "linkedLeadId"),
    source: formString(formData, "source"),
  });
}

function revalidateInquiryPaths(inquiryId?: string) {
  revalidatePath("/leads/inquiries");
  if (inquiryId) revalidatePath(`/leads/inquiries/${inquiryId}`);
}

export async function createInquiryAction(
  _prev: InquiryActionResult | null,
  formData: FormData,
): Promise<InquiryActionResult> {
  try {
    const tenant = await requirePermission("lead.create");
    const data = inquiryPayload(formData);

    if (data.linkedLeadId) {
      const lead = await prisma.lead.findFirst({
        where: { id: data.linkedLeadId, organizationId: tenant.organizationId },
      });
      if (!lead) {
        return { ok: false, error: "Linked lead not found" };
      }
    }

    if (data.assignedUserId) {
      const member = await prisma.organizationMember.findFirst({
        where: {
          organizationId: tenant.organizationId,
          userId: data.assignedUserId,
          status: "ACTIVE",
        },
      });
      if (!member) {
        return { ok: false, error: "Assigned user is not an active member" };
      }
    }

    const inquiry = await prisma.inquiry.create({
      data: {
        organizationId: tenant.organizationId,
        subject: data.subject,
        description: data.description || null,
        contactName: data.contactName,
        email: data.email || null,
        phone: data.phone || null,
        status: data.status ?? "OPEN",
        priority: data.priority ?? "MEDIUM",
        assignedUserId: data.assignedUserId || null,
        linkedLeadId: data.linkedLeadId || null,
        source: data.source || null,
      },
    });

    revalidateInquiryPaths(inquiry.id);
    return { ok: true, inquiryId: inquiry.id, message: "Inquiry created" };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        ok: false,
        error: error.errors[0]?.message ?? "Invalid form data",
      };
    }
    if (isAppError(error)) {
      return { ok: false, error: error.message, code: error.code };
    }
    console.error("createInquiryAction failed", error);
    return { ok: false, error: "Failed to create inquiry" };
  }
}

export async function updateInquiryAction(
  _prev: InquiryActionResult | null,
  formData: FormData,
): Promise<InquiryActionResult> {
  try {
    const tenant = await requirePermission("lead.edit");
    const inquiryId = formString(formData, "inquiryId");
    if (!inquiryId) {
      return { ok: false, error: "Inquiry ID is required" };
    }

    const existing = await prisma.inquiry.findFirst({
      where: { id: inquiryId, organizationId: tenant.organizationId },
    });
    if (!existing) {
      return { ok: false, error: "Inquiry not found", code: "NOT_FOUND" };
    }

    const data = inquiryPayload(formData);

    if (data.linkedLeadId) {
      const lead = await prisma.lead.findFirst({
        where: { id: data.linkedLeadId, organizationId: tenant.organizationId },
      });
      if (!lead) {
        return { ok: false, error: "Linked lead not found" };
      }
    }

    if (data.assignedUserId) {
      const member = await prisma.organizationMember.findFirst({
        where: {
          organizationId: tenant.organizationId,
          userId: data.assignedUserId,
          status: "ACTIVE",
        },
      });
      if (!member) {
        return { ok: false, error: "Assigned user is not an active member" };
      }
    }

    await prisma.inquiry.update({
      where: { id: inquiryId },
      data: {
        subject: data.subject,
        description: data.description || null,
        contactName: data.contactName,
        email: data.email || null,
        phone: data.phone || null,
        status: data.status ?? existing.status,
        priority: data.priority ?? existing.priority,
        assignedUserId: data.assignedUserId || null,
        linkedLeadId: data.linkedLeadId || null,
        source: data.source || null,
      },
    });

    revalidateInquiryPaths(inquiryId);
    return { ok: true, inquiryId, message: "Inquiry updated" };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        ok: false,
        error: error.errors[0]?.message ?? "Invalid form data",
      };
    }
    if (isAppError(error)) {
      return { ok: false, error: error.message, code: error.code };
    }
    console.error("updateInquiryAction failed", error);
    return { ok: false, error: "Failed to update inquiry" };
  }
}
