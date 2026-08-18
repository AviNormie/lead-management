import { NextResponse } from "next/server";
import { getMissingEnvVars, hasSupabasePublicEnv } from "@/lib/config/env";

export async function GET() {
  const missing = getMissingEnvVars();

  return NextResponse.json({
    status: missing.length === 0 ? "ok" : "misconfigured",
    service: "intracore",
    supabasePublic: hasSupabasePublicEnv(),
    missingEnv: missing,
    timestamp: new Date().toISOString(),
  });
}
