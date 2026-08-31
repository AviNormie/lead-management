import { createAdminClient } from "@/lib/supabase/admin";
import { AppError } from "@/lib/errors";

export const CALL_RECORDING_BUCKET = "lead-call-recordings";
export const CALL_RECORDING_MAX_BYTES = 25 * 1024 * 1024;

export const ALLOWED_CALL_RECORDING_MIME_TYPES = [
  "audio/mpeg",
  "audio/wav",
  "audio/mp4",
  "audio/webm",
  "audio/x-m4a",
] as const;

export type AllowedCallRecordingMimeType =
  (typeof ALLOWED_CALL_RECORDING_MIME_TYPES)[number];

const MIME_TO_EXT: Record<AllowedCallRecordingMimeType, string> = {
  "audio/mpeg": "mp3",
  "audio/wav": "wav",
  "audio/mp4": "m4a",
  "audio/webm": "webm",
  "audio/x-m4a": "m4a",
};

export function validateCallRecordingFile(file: {
  type: string;
  size: number;
}): { mimeType: AllowedCallRecordingMimeType; ext: string } {
  if (
    !ALLOWED_CALL_RECORDING_MIME_TYPES.includes(
      file.type as AllowedCallRecordingMimeType,
    )
  ) {
    throw new AppError(
      "INVALID_FILE",
      "Unsupported audio format. Allowed: MP3, WAV, M4A, WebM",
      400,
    );
  }
  if (file.size > CALL_RECORDING_MAX_BYTES) {
    throw new AppError(
      "FILE_TOO_LARGE",
      "Recording must be 25MB or less",
      400,
    );
  }
  const mimeType = file.type as AllowedCallRecordingMimeType;
  return { mimeType, ext: MIME_TO_EXT[mimeType] };
}

export function buildCallRecordingPath(
  organizationId: string,
  leadId: string,
  callRecordId: string,
  ext: string,
): string {
  return `${organizationId}/${leadId}/${callRecordId}.${ext}`;
}

export async function uploadCallRecording(
  path: string,
  body: ArrayBuffer | Buffer,
  mimeType: string,
): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.storage
    .from(CALL_RECORDING_BUCKET)
    .upload(path, body, { contentType: mimeType, upsert: true });
  if (error) {
    throw new AppError("UPLOAD_FAILED", error.message, 500);
  }
}

export async function getCallRecordingSignedUrl(
  path: string,
  expiresInSec = 3600,
): Promise<{ signedUrl: string; expiresAt: string }> {
  const supabase = createAdminClient();
  const { data, error } = await supabase.storage
    .from(CALL_RECORDING_BUCKET)
    .createSignedUrl(path, expiresInSec);
  if (error || !data?.signedUrl) {
    throw new AppError(
      "SIGNED_URL_FAILED",
      error?.message ?? "Failed to create signed URL",
      500,
    );
  }
  const expiresAt = new Date(Date.now() + expiresInSec * 1000).toISOString();
  return { signedUrl: data.signedUrl, expiresAt };
}

export async function deleteCallRecording(path: string): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.storage
    .from(CALL_RECORDING_BUCKET)
    .remove([path]);
  if (error) {
    throw new AppError("DELETE_FAILED", error.message, 500);
  }
}
