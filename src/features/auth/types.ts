export type ActionResult =
  | { ok: true; message?: string; needsVerification?: boolean }
  | { ok: false; error: string; code?: string };
