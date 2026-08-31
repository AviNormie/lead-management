"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function authErrorMessage(message: string) {
  if (message === "fetch failed" || message.toLowerCase().includes("failed to fetch")) {
    return "Could not reach the auth service. Check your connection and try again.";
  }
  if (message.includes("rate limit")) {
    return "Too many reset attempts. Please wait a few minutes and try again.";
  }
  return message;
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setError("Email is required");
      return;
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    if (!supabaseUrl || !supabaseAnonKey || !siteUrl) {
      setError(
        "Server is not configured. Add Supabase env vars and NEXT_PUBLIC_SITE_URL, then restart the app.",
      );
      return;
    }

    setPending(true);
    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        normalizedEmail,
        {
          redirectTo: `${siteUrl}/auth/callback?next=/reset-password`,
        },
      );

      if (resetError) {
        setError(authErrorMessage(resetError.message));
        return;
      }

      setSuccessMessage("If an account exists, a reset email has been sent.");
    } catch (submitError) {
      console.error("forgot password failed", submitError);
      setError("Could not send reset email. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas p-4">
      <div className="ic-panel w-full max-w-md p-8">
        <h1 className="mb-2 text-2xl font-bold tracking-tight">
          Reset password
        </h1>
        <p className="mb-6 text-sm text-muted">
          Enter your email and we will send a reset link.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={pending}
            />
          </div>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
          {successMessage ? (
            <p className="text-sm text-success">{successMessage}</p>
          ) : null}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Sending…" : "Send reset link"}
          </Button>
        </form>
        <p className="mt-6 text-center text-sm">
          <Link href="/login" className="text-primary">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
