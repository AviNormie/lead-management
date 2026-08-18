"use server";

import { redirect } from "next/navigation";
import { getDatabaseErrorMessage } from "@/lib/db/error-message";
import { getSiteUrl, hasSupabasePublicEnv } from "@/lib/config/env";
import { createClient } from "@/lib/supabase/server";
import { ensurePrismaUser } from "@/lib/auth/ensure-user";
import { isAppError } from "@/lib/errors";
import { loginSchema, registerSchema } from "@/lib/validations/auth";

export type ActionResult =
  | { ok: true; message?: string; needsVerification?: boolean }
  | { ok: false; error: string; code?: string };

function configError(): ActionResult {
  return {
    ok: false,
    error:
      "Server is not configured. Add Supabase and database env vars in Vercel, then redeploy.",
    code: "CONFIG",
  };
}

export async function registerAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    if (!hasSupabasePublicEnv()) {
      return configError();
    }

    const parsed = registerSchema.safeParse({
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
    });
    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues[0]?.message ?? "Invalid input",
      };
    }

    const email = parsed.data.email.toLowerCase();
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password: parsed.data.password,
      options: {
        data: { name: parsed.data.name },
        emailRedirectTo: `${getSiteUrl()}/auth/callback`,
      },
    });

    if (error) {
      return { ok: false, error: error.message };
    }
    if (!data.user) {
      return { ok: false, error: "Registration failed" };
    }

    await ensurePrismaUser({
      ...data.user,
      user_metadata: { ...data.user.user_metadata, name: parsed.data.name },
    });

    if (!data.session) {
      return { ok: true, needsVerification: true };
    }

    return { ok: true };
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("Missing NEXT_PUBLIC_SUPABASE")
    ) {
      return configError();
    }
    if (isAppError(error)) {
      return { ok: false, error: error.message, code: error.code };
    }
    console.error(error);
    return {
      ok: false,
      error: getDatabaseErrorMessage(error),
      code: "DATABASE",
    };
  }
}

export async function loginAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  try {
    if (!hasSupabasePublicEnv()) {
      return configError();
    }

    const parsed = loginSchema.safeParse({
      email: formData.get("email"),
      password: formData.get("password"),
    });
    if (!parsed.success) {
      return {
        ok: false,
        error: parsed.error.issues[0]?.message ?? "Invalid input",
      };
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email.toLowerCase(),
      password: parsed.data.password,
    });

    if (error) {
      return { ok: false, error: "Invalid email or password" };
    }
    if (data.user) {
      try {
        await ensurePrismaUser(data.user);
      } catch (error) {
        console.error("ensurePrismaUser failed after login", error);
        await supabase.auth.signOut();
        return {
          ok: false,
          error: getDatabaseErrorMessage(error),
          code: "DATABASE",
        };
      }
    }
    return { ok: true };
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.includes("Missing NEXT_PUBLIC_SUPABASE")
    ) {
      return configError();
    }
    console.error(error);
    return { ok: false, error: "Login failed" };
  }
}

export async function logoutAction() {
  if (!hasSupabasePublicEnv()) {
    redirect("/setup");
  }
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function forgotPasswordAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (!email) {
    return { ok: false, error: "Email is required" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${getSiteUrl()}/auth/callback?next=/reset-password`,
  });
  if (error) {
    return { ok: false, error: error.message };
  }
  return {
    ok: true,
    message: "If an account exists, a reset email has been sent.",
  };
}

export async function updatePasswordAction(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}
