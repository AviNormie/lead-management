"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Lead, LeadPriority } from "@prisma/client";
import {
  createLeadAction,
  updateLeadAction,
  type LeadActionResult,
} from "@/features/leads/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Lookup = {
  sources: { id: string; name: string }[];
  stages: { id: string; name: string; pipelineId: string }[];
  members: { user: { id: string; name: string | null; email: string } }[];
};

const initial: LeadActionResult | null = null;

export function LeadForm({
  lookups,
  lead,
}: {
  lookups: Lookup;
  lead?: Pick<
    Lead,
    | "id"
    | "firstName"
    | "lastName"
    | "company"
    | "email"
    | "phone"
    | "whatsappNumber"
    | "city"
    | "country"
    | "jobTitle"
    | "expectedValue"
    | "sourceId"
    | "stageId"
    | "priority"
    | "status"
    | "assignedUserId"
    | "description"
  >;
}) {
  const router = useRouter();
  const action = lead ? updateLeadAction : createLeadAction;
  const [state, formAction, pending] = useActionState(action, initial);

  useEffect(() => {
    if (state?.ok && state.leadId) {
      router.push(`/leads/${state.leadId}`);
    }
  }, [state, router]);

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-2">
      {lead ? <input type="hidden" name="leadId" value={lead.id} /> : null}
      {state && !state.ok && state.code === "DUPLICATE" ? (
        <input type="hidden" name="forceCreate" value="true" />
      ) : null}

      <div>
        <Label htmlFor="firstName">First name</Label>
        <Input id="firstName" name="firstName" defaultValue={lead?.firstName ?? ""} />
      </div>
      <div>
        <Label htmlFor="lastName">Last name</Label>
        <Input id="lastName" name="lastName" defaultValue={lead?.lastName ?? ""} />
      </div>
      <div>
        <Label htmlFor="company">Company</Label>
        <Input id="company" name="company" defaultValue={lead?.company ?? ""} />
      </div>
      <div>
        <Label htmlFor="jobTitle">Job title</Label>
        <Input id="jobTitle" name="jobTitle" defaultValue={lead?.jobTitle ?? ""} />
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" defaultValue={lead?.email ?? ""} />
      </div>
      <div>
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" name="phone" defaultValue={lead?.phone ?? ""} />
      </div>
      <div>
        <Label htmlFor="whatsappNumber">WhatsApp</Label>
        <Input
          id="whatsappNumber"
          name="whatsappNumber"
          defaultValue={lead?.whatsappNumber ?? ""}
        />
      </div>
      <div>
        <Label htmlFor="city">City</Label>
        <Input id="city" name="city" defaultValue={lead?.city ?? ""} />
      </div>
      <div>
        <Label htmlFor="country">Country</Label>
        <Input id="country" name="country" defaultValue={lead?.country ?? ""} />
      </div>
      <div>
        <Label htmlFor="expectedValue">Expected value</Label>
        <Input
          id="expectedValue"
          name="expectedValue"
          type="number"
          min="0"
          step="0.01"
          defaultValue={lead?.expectedValue?.toString() ?? ""}
        />
      </div>
      <div>
        <Label htmlFor="sourceId">Source</Label>
        <select
          id="sourceId"
          name="sourceId"
          defaultValue={lead?.sourceId ?? ""}
          className="flex h-10 w-full rounded-xl border border-[var(--ic-border)] bg-white px-3 text-sm"
        >
          <option value="">Select source</option>
          {lookups.sources.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="stageId">Stage</Label>
        <select
          id="stageId"
          name="stageId"
          defaultValue={lead?.stageId ?? ""}
          className="flex h-10 w-full rounded-xl border border-[var(--ic-border)] bg-white px-3 text-sm"
        >
          <option value="">Select stage</option>
          {lookups.stages.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor="priority">Priority</Label>
        <select
          id="priority"
          name="priority"
          defaultValue={(lead?.priority as LeadPriority) ?? "MEDIUM"}
          className="flex h-10 w-full rounded-xl border border-[var(--ic-border)] bg-white px-3 text-sm"
        >
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="URGENT">Urgent</option>
        </select>
      </div>
      <div>
        <Label htmlFor="assignedUserId">Assigned to</Label>
        <select
          id="assignedUserId"
          name="assignedUserId"
          defaultValue={lead?.assignedUserId ?? ""}
          className="flex h-10 w-full rounded-xl border border-[var(--ic-border)] bg-white px-3 text-sm"
        >
          <option value="">Unassigned</option>
          {lookups.members.map((m) => (
            <option key={m.user.id} value={m.user.id}>
              {m.user.name ?? m.user.email}
            </option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-2">
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={lead?.description ?? ""}
          className="w-full rounded-xl border border-[var(--ic-border)] px-3 py-2 text-sm"
        />
      </div>

      {state && !state.ok ? (
        <div className="sm:col-span-2 rounded-xl bg-red-50 p-3 text-sm text-danger">
          <p>{state.error}</p>
          {state.duplicates?.length ? (
            <ul className="mt-2 list-disc pl-4">
              {state.duplicates.map((d) => (
                <li key={d.id}>
                  {d.fullName} ({d.matchedOn.join(", ")})
                </li>
              ))}
            </ul>
          ) : null}
          {state && !state.ok && state.code === "DUPLICATE" ? (
            <p className="mt-2 text-muted">
              Submit again to create the lead anyway.
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : lead ? "Save lead" : "Create lead"}
        </Button>
      </div>
    </form>
  );
}
