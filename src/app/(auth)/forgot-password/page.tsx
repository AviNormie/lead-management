"use client";

import Link from "next/link";
import { useActionState } from "react";
import {
  forgotPasswordAction,
} from "@/features/auth/actions";
import type { ActionResult } from "@/features/auth/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initial: ActionResult | null = null;

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState(
    forgotPasswordAction,
    initial,
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas p-4">
      <div className="ic-panel w-full max-w-md p-8">
        <h1 className="mb-2 text-2xl font-bold tracking-tight">
          Reset password
        </h1>
        <p className="mb-6 text-sm text-muted">
          Enter your email and we will send a reset link.
        </p>
        <form action={formAction} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              disabled={pending}
            />
          </div>
          {state && !state.ok ? (
            <p className="text-sm text-danger">{state.error}</p>
          ) : null}
          {state?.ok ? (
            <p className="text-sm text-success">
              {state.message ?? "Check your email."}
            </p>
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
