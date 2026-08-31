import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { isAppError } from "@/lib/errors";
import { requirePermission } from "@/lib/tenant";
import { leadVisibilityWhere } from "@/features/leads/scope";
import { getCallRecordingSignedUrl } from "@/lib/storage/call-recordings";

type RouteContext = { params: Promise<{ id: string; recordId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const tenant = await requirePermission("lead.view");
    const { id: leadId, recordId } = await context.params;

    const lead = await prisma.lead.findFirst({
      where: {
        id: leadId,
        ...leadVisibilityWhere(tenant),
        archivedAt: null,
      },
    });
    if (!lead) {
      return NextResponse.json({ ok: false, error: "Lead not found" }, { status: 404 });
    }

    const callRecord = await prisma.leadCallRecord.findFirst({
      where: {
        id: recordId,
        leadId,
        organizationId: tenant.organizationId,
      },
    });
    if (!callRecord) {
      return NextResponse.json(
        { ok: false, error: "Call record not found" },
        { status: 404 },
      );
    }
    if (!callRecord.recordingPath) {
      return NextResponse.json(
        { ok: false, error: "No recording for this call" },
        { status: 404 },
      );
    }

    const { signedUrl, expiresAt } = await getCallRecordingSignedUrl(
      callRecord.recordingPath,
    );

    return NextResponse.json({
      ok: true,
      signedUrl,
      expiresAt,
      recordingFileName: callRecord.recordingFileName,
      recordingMimeType: callRecord.recordingMimeType,
      recordingSizeBytes: callRecord.recordingSizeBytes,
      recordingDurationSec: callRecord.recordingDurationSec,
    });
  } catch (error) {
    if (isAppError(error)) {
      return NextResponse.json(
        { ok: false, error: error.message, code: error.code },
        { status: error.status },
      );
    }
    console.error("Call recording playback failed", error);
    return NextResponse.json(
      { ok: false, error: "Failed to get recording" },
      { status: 500 },
    );
  }
}
