import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { isAppError } from "@/lib/errors";
import { requirePermission } from "@/lib/tenant";
import { leadVisibilityWhere } from "@/features/leads/scope";
import {
  buildCallRecordingPath,
  deleteCallRecording,
  uploadCallRecording,
  validateCallRecordingFile,
} from "@/lib/storage/call-recordings";
import { recordActivity } from "@/lib/leads/activity";
import { LEAD_ACTIVITY_TYPES } from "@/lib/leads/activity-types";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  try {
    const tenant = await requirePermission("lead.log_calls");
    const { id: leadId } = await context.params;

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

    const formData = await request.formData();
    const callRecordId = String(formData.get("callRecordId") ?? "").trim();
    const file = formData.get("file");

    if (!callRecordId) {
      return NextResponse.json(
        { ok: false, error: "callRecordId is required" },
        { status: 400 },
      );
    }
    if (!file || !(file instanceof File) || file.size === 0) {
      return NextResponse.json(
        { ok: false, error: "Recording file is required" },
        { status: 400 },
      );
    }

    const callRecord = await prisma.leadCallRecord.findFirst({
      where: {
        id: callRecordId,
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

    const recordingDurationRaw = String(
      formData.get("recordingDurationSec") ?? "",
    ).trim();
    const recordingDurationSec = recordingDurationRaw
      ? Number(recordingDurationRaw)
      : null;
    const didNumber =
      String(formData.get("didNumber") ?? "").trim() ||
      callRecord.didNumber ||
      null;

    const { mimeType, ext } = validateCallRecordingFile({
      type: file.type,
      size: file.size,
    });
    const recordingPath = buildCallRecordingPath(
      tenant.organizationId,
      leadId,
      callRecordId,
      ext,
    );
    const buffer = Buffer.from(await file.arrayBuffer());

    if (callRecord.recordingPath && callRecord.recordingPath !== recordingPath) {
      await deleteCallRecording(callRecord.recordingPath);
    }

    await uploadCallRecording(recordingPath, buffer, mimeType);

    await prisma.leadCallRecord.update({
      where: { id: callRecordId },
      data: {
        didNumber,
        recordingPath,
        recordingFileName: file.name,
        recordingMimeType: mimeType,
        recordingSizeBytes: file.size,
        recordingDurationSec: Number.isFinite(recordingDurationSec)
          ? recordingDurationSec
          : null,
      },
    });

    await recordActivity({
      organizationId: tenant.organizationId,
      leadId,
      actorId: tenant.userId,
      type: LEAD_ACTIVITY_TYPES.CALL_RECORDING_UPLOADED,
      message: `Call recording uploaded: ${file.name}`,
      next: {
        callRecordId,
        recordingFileName: file.name,
        recordingMimeType: mimeType,
        recordingSizeBytes: file.size,
        recordingDurationSec: Number.isFinite(recordingDurationSec)
          ? recordingDurationSec
          : null,
      },
    });

    return NextResponse.json({
      ok: true,
      callRecordId,
      recordingPath,
      recordingFileName: file.name,
      recordingMimeType: mimeType,
      recordingSizeBytes: file.size,
    });
  } catch (error) {
    if (isAppError(error)) {
      return NextResponse.json(
        { ok: false, error: error.message, code: error.code },
        { status: error.status },
      );
    }
    console.error("Call recording upload failed", error);
    return NextResponse.json(
      { ok: false, error: "Upload failed" },
      { status: 500 },
    );
  }
}
