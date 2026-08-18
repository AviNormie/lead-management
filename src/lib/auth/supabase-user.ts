import { hasSupabasePublicEnv } from "@/lib/config/env";
import { createClient } from "@/lib/supabase/server";

export async function getSupabaseAuthUser() {
  if (!hasSupabasePublicEnv()) {
    return null;
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user ?? null;
  } catch (error) {
    console.error("getSupabaseAuthUser failed", error);
    return null;
  }
}
