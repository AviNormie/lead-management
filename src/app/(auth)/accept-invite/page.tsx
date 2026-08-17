"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useActionState, useEffect } from "react";
import { acceptInvitationAction } from "@/features/members/actions";
import type { ActionResult } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initial: ActionResult | null = null;

function AcceptInviteForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [state, formAction, pending] = useActionState(
    acceptInvitationAction,
    initial,
  );

  useEffect(() => {
    if (state?.ok && state.needsVerification) {
      router.push("/verify-email");
      return;
    }
    if (state?.ok) {
      router.refresh();
      router.push("/dashboard");
    }
  }, [state, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas p-4">
      <div className="ic-panel w-full max-w-md p-8">
        <h1 className="mb-2 text-2xl font-bold tracking-tight">
          Accept invitation
        </h1>
        <p className="mb-6 text-sm text-muted">
          Join the organization you were invited to. If you already have an
          account, sign in first then open this link again.
        </p>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="token" value={token} />
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" type="text" disabled={pending} />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              minLength={8}
              disabled={pending}
            />
          </div>
          {state && !state.ok ? (
            <p className="text-sm text-danger">{state.error}</p>
          ) : null}
          {state?.ok && state.message ? (
            <p className="text-sm text-muted">{state.message}</p>
          ) : null}
          <Button type="submit" className="w-full" disabled={pending || !token}>
            {pending ? "Accepting…" : "Accept invitation"}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-canvas p-4 text-sm text-muted">
          Loading…
        </div>
      }
    >
      <AcceptInviteForm />
    </Suspense>
  );
}
