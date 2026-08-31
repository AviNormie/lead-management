import { NextResponse } from "next/server";
import { getMissingEnvVars, hasSupabasePublicEnv } from "@/lib/config/env";
import { isEmailConfigured } from "@/lib/email/client";

export async function GET() {
  const missing = getMissingEnvVars();

  return NextResponse.json({
    status: missing.length === 0 ? "ok" : "misconfigured",
    service: "intracore",
    supabasePublic: hasSupabasePublicEnv(),
    emailConfigured: isEmailConfigured(),
    missingEnv: missing,
    timestamp: new Date().toISOString(),
  });
}
