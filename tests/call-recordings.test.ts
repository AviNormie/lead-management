import { describe, expect, it } from "vitest";
import {
  ALLOWED_CALL_RECORDING_MIME_TYPES,
  CALL_RECORDING_MAX_BYTES,
  buildCallRecordingPath,
  validateCallRecordingFile,
} from "@/lib/storage/call-recordings";
import { readFileSync } from "fs";
import path from "path";

describe("validateCallRecordingFile", () => {
  it("accepts allowed MIME types", () => {
    for (const mimeType of ALLOWED_CALL_RECORDING_MIME_TYPES) {
      const result = validateCallRecordingFile({
        type: mimeType,
        size: 1024,
      });
      expect(result.mimeType).toBe(mimeType);
      expect(result.ext).toBeTruthy();
    }
  });

  it("rejects unsupported MIME types", () => {
    expect(() =>
      validateCallRecordingFile({ type: "video/mp4", size: 1024 }),
    ).toThrow("Unsupported audio format");
  });

  it("rejects files over 25MB", () => {
    expect(() =>
      validateCallRecordingFile({
        type: "audio/mpeg",
        size: CALL_RECORDING_MAX_BYTES + 1,
      }),
    ).toThrow("25MB");
  });
});

describe("buildCallRecordingPath", () => {
  it("scopes storage paths by organization and lead", () => {
    expect(
      buildCallRecordingPath("org-a", "lead-b", "call-c", "mp3"),
    ).toBe("org-a/lead-b/call-c.mp3");
  });

  it("prevents cross-tenant path guessing via org prefix", () => {
    const orgA = buildCallRecordingPath("org-a", "lead-1", "rec-1", "mp3");
    const orgB = buildCallRecordingPath("org-b", "lead-1", "rec-1", "mp3");
    expect(orgA).not.toBe(orgB);
    expect(orgA.startsWith("org-a/")).toBe(true);
    expect(orgB.startsWith("org-b/")).toBe(true);
  });
});

describe("call recording API tenant isolation", () => {
  it("verifies organization on upload route", () => {
    const route = readFileSync(
      path.join(
        process.cwd(),
        "src/app/api/leads/[id]/call-records/upload/route.ts",
      ),
      "utf8",
    );
    expect(route).toContain("organizationId");
    expect(route).toContain("lead.log_calls");
  });

  it("verifies organization on signed URL route", () => {
    const route = readFileSync(
      path.join(
        process.cwd(),
        "src/app/api/leads/[id]/call-records/[recordId]/recording/route.ts",
      ),
      "utf8",
    );
    expect(route).toContain("organizationId");
    expect(route).toContain("recordingPath");
  });
});
