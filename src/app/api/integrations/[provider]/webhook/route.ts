import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { findDuplicateLeads } from "@/lib/leads/duplicates";
import { computeFullName } from "@/lib/validations/leads";
import { recordActivity } from "@/lib/leads/activity";
import { LEAD_ACTIVITY_TYPES } from "@/lib/leads/activity-types";

type WebhookPayload = {
  organizationId: string;
  provider: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  company?: string;
  sourceDetail?: string;
};

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as WebhookPayload;
    if (!payload.organizationId || !payload.provider) {
      return NextResponse.json({ ok: false, error: "Invalid payload" }, { status: 400 });
    }

    const integration = await prisma.integration.findUnique({
      where: {
        organizationId_provider: {
          organizationId: payload.organizationId,
          provider: payload.provider,
        },
      },
    });

    if (!integration || integration.status !== "CONNECTED") {
      return NextResponse.json({ ok: false, error: "Integration not connected" }, { status: 403 });
    }

    const sources = await prisma.leadSource.findMany({
      where: { organizationId: payload.organizationId, isActive: true },
    });
    const source =
      sources.find((s) => s.code === payload.provider) ??
      sources.find((s) => s.code === "website") ??
      sources[0];

    const pipeline = await prisma.pipeline.findFirst({
      where: { organizationId: payload.organizationId, isDefault: true },
      include: { stages: { orderBy: { sortOrder: "asc" }, take: 1 } },
    });

    const phone = payload.phone?.trim();
    const email = payload.email?.trim().toLowerCase();
    if (!phone && !email) {
      return NextResponse.json({ ok: false, error: "Phone or email required" }, { status: 400 });
    }

    const dupes = await findDuplicateLeads(payload.organizationId, {
      email,
      phone,
      company: payload.company,
    });
    if (dupes.length > 0) {
      return NextResponse.json({ ok: false, duplicate: true, leadId: dupes[0].id });
    }

    const lead = await prisma.lead.create({
      data: {
        organizationId: payload.organizationId,
        firstName: payload.firstName,
        lastName: payload.lastName,
        fullName: computeFullName(payload),
        company: payload.company,
        email,
        phone: phone ?? email ?? "unknown",
        sourceId: source?.id,
        sourceDetail: payload.sourceDetail,
        pipelineId: pipeline?.id,
        stageId: pipeline?.stages[0]?.id,
        status: "NEW",
      },
    });

    await recordActivity({
      organizationId: payload.organizationId,
      leadId: lead.id,
      type: LEAD_ACTIVITY_TYPES.CREATED,
      message: `Lead ingested from ${payload.provider}`,
    });

    return NextResponse.json({ ok: true, leadId: lead.id });
  } catch (error) {
    console.error("Integration webhook failed", error);
    return NextResponse.json({ ok: false, error: "Webhook failed" }, { status: 500 });
  }
}
