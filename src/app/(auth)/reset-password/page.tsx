"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import {
  updatePasswordAction,
  type ActionResult,
} from "@/features/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initial: ActionResult | null = null;

export default function ResetPasswordPage() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    updatePasswordAction,
    initial,
  );

  useEffect(() => {
    if (state?.ok) {
      router.push("/dashboard");
    }
  }, [state, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas p-4">
      <div className="ic-panel w-full max-w-md p-8">
        <h1 className="mb-2 text-2xl font-bold tracking-tight">
          Set a new password
        </h1>
        <p className="mb-6 text-sm text-muted">
          Choose a password of at least 8 characters.
        </p>
        <form action={formAction} className="space-y-4">
          <div>
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              disabled={pending}
            />
          </div>
          {state && !state.ok ? (
            <p className="text-sm text-danger">{state.error}</p>
          ) : null}
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Updating…" : "Update password"}
          </Button>
        </form>
      </div>
    </div>
  );
}
