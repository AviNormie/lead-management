import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensurePrismaUser } from "@/lib/auth/ensure-user";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";
  const safeNext = next.startsWith("/") ? next : "/dashboard";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error || !data.user) {
      return NextResponse.redirect(`${origin}/login?error=auth`);
    }

    try {
      await ensurePrismaUser(data.user);
    } catch (dbError) {
      console.error("ensurePrismaUser failed in auth callback", dbError);
      return NextResponse.redirect(`${origin}/auth/session-error`);
    }

    return NextResponse.redirect(`${origin}${safeNext}`);
  } catch (error) {
    console.error("auth callback failed", error);
    return NextResponse.redirect(`${origin}/login?error=auth`);
  }
}
