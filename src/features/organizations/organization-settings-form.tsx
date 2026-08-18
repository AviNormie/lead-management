"use client";

import { useActionState } from "react";
import {
  updateOrganizationAction,
} from "@/features/organizations/actions";
import type { ActionResult } from "@/features/auth/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initial: ActionResult | null = null;

type Org = {
  name: string;
  industry: string | null;
  country: string | null;
  currency: string;
  timezone: string;
  contactEmail: string | null;
  contactPhone: string | null;
};

export function OrganizationSettingsForm({
  organization,
  canUpdate,
}: {
  organization: Org;
  canUpdate: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    updateOrganizationAction,
    initial,
  );

  return (
    <form action={formAction} className="grid max-w-2xl gap-4 sm:grid-cols-2">
      <fieldset disabled={!canUpdate} className="contents">
        <div className="sm:col-span-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" defaultValue={organization.name} required />
        </div>
        <div>
          <Label htmlFor="industry">Industry</Label>
          <Input
            id="industry"
            name="industry"
            defaultValue={organization.industry ?? ""}
          />
        </div>
        <div>
          <Label htmlFor="country">Country</Label>
          <Input
            id="country"
            name="country"
            defaultValue={organization.country ?? ""}
          />
        </div>
        <div>
          <Label htmlFor="currency">Currency</Label>
          <Input
            id="currency"
            name="currency"
            defaultValue={organization.currency}
          />
        </div>
        <div>
          <Label htmlFor="timezone">Timezone</Label>
          <Input
            id="timezone"
            name="timezone"
            defaultValue={organization.timezone}
          />
        </div>
        <div>
          <Label htmlFor="contactEmail">Contact email</Label>
          <Input
            id="contactEmail"
            name="contactEmail"
            type="email"
            defaultValue={organization.contactEmail ?? ""}
          />
        </div>
        <div>
          <Label htmlFor="contactPhone">Contact phone</Label>
          <Input
            id="contactPhone"
            name="contactPhone"
            defaultValue={organization.contactPhone ?? ""}
          />
        </div>
      </fieldset>
      {state && !state.ok ? (
        <p className="sm:col-span-2 text-sm text-danger">{state.error}</p>
      ) : null}
      {state?.ok ? (
        <p className="sm:col-span-2 text-sm text-success">Saved.</p>
      ) : null}
      {canUpdate ? (
        <div className="sm:col-span-2">
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      ) : (
        <p className="sm:col-span-2 text-sm text-muted">
          You do not have permission to update the organization.
        </p>
      )}
    </form>
  );
}
