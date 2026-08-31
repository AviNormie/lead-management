import { Resend } from "resend";

let client: Resend | null = null;

export function isEmailConfigured(): boolean {
  return Boolean(
    process.env.RESEND_API_KEY?.trim() && process.env.RESEND_FROM_EMAIL?.trim(),
  );
}

export function getFromEmail(): string | null {
  return process.env.RESEND_FROM_EMAIL?.trim() || null;
}

export function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return null;
  if (!client) {
    client = new Resend(apiKey);
  }
  return client;
}

/** Test helper — reset lazy client between tests. */
export function resetResendClientForTests() {
  client = null;
}
