"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { createOrganizationAction } from "@/features/organizations/actions";
import type { ActionResult } from "@/features/auth/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initial: ActionResult | null = null;

export default function CreateOrganizationPage() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    createOrganizationAction,
    initial,
  );

  useEffect(() => {
    if (state?.ok) {
      router.refresh();
      router.push("/dashboard");
    }
  }, [state, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas p-4">
      <div className="ic-panel w-full max-w-lg p-8">
        <div className="mb-8">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-sm font-bold text-white">
            IC
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Create your organization
          </h1>
          <p className="mt-1 text-sm text-muted">
            You will become the owner with full permissions.
          </p>
        </div>

        <form action={formAction} className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="name">Company name *</Label>
            <Input id="name" name="name" required disabled={pending} />
          </div>
          <div>
            <Label htmlFor="industry">Industry</Label>
            <Input id="industry" name="industry" disabled={pending} />
          </div>
          <div>
            <Label htmlFor="country">Country</Label>
            <Input id="country" name="country" disabled={pending} />
          </div>
          <div>
            <Label htmlFor="currency">Currency</Label>
            <Input
              id="currency"
              name="currency"
              defaultValue="USD"
              maxLength={3}
              disabled={pending}
            />
          </div>
          <div>
            <Label htmlFor="timezone">Timezone</Label>
            <Input
              id="timezone"
              name="timezone"
              defaultValue="UTC"
              disabled={pending}
            />
          </div>
          <div>
            <Label htmlFor="contactEmail">Contact email</Label>
            <Input
              id="contactEmail"
              name="contactEmail"
              type="email"
              disabled={pending}
            />
          </div>
          <div>
            <Label htmlFor="contactPhone">Contact phone</Label>
            <Input
              id="contactPhone"
              name="contactPhone"
              type="tel"
              disabled={pending}
            />
          </div>
          {state && !state.ok ? (
            <p className="sm:col-span-2 text-sm text-danger">{state.error}</p>
          ) : null}
          <div className="sm:col-span-2">
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "Creating…" : "Create organization"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
