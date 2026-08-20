import { cache } from "react";
import { hasSupabasePublicEnv } from "@/lib/config/env";
import { createClient } from "@/lib/supabase/server";

async function loadSupabaseAuthUser() {
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

/** Request-scoped so layout + tenant share one getUser() call. */
export const getSupabaseAuthUser = cache(loadSupabaseAuthUser);
