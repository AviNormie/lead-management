"use client";

import { useActionState } from "react";
import { addNoteAction } from "@/features/leads/workflow-actions";
import {
  createFollowUpAction,
  createTaskAction,
} from "@/features/leads/workflow-actions";
import {
  assignLeadAction,
  changeLeadStageAction,
  changeLeadStatusAction,
} from "@/features/leads/actions";
import type { ActionResult } from "@/features/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LeadStatus } from "@prisma/client";

const initial: ActionResult | null = null;

export function NoteForm({ leadId }: { leadId: string }) {
  const [state, action, pending] = useActionState(addNoteAction, initial);
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="leadId" value={leadId} />
      <textarea
        name="content"
        required
        rows={3}
        placeholder="Add a note…"
        className="w-full rounded-xl border border-[var(--ic-border)] px-3 py-2 text-sm"
      />
      {state && !state.ok ? (
        <p className="text-sm text-danger">{state.error}</p>
      ) : null}
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "Saving…" : "Add note"}
      </Button>
    </form>
  );
}

export function TaskForm({ leadId }: { leadId: string }) {
  const [state, action, pending] = useActionState(createTaskAction, initial);
  return (
    <form action={action} className="grid gap-2 sm:grid-cols-2">
      <input type="hidden" name="leadId" value={leadId} />
      <div className="sm:col-span-2">
        <Label htmlFor="title">Task title</Label>
        <Input id="title" name="title" required />
      </div>
      <div>
        <Label htmlFor="dueDate">Due date</Label>
        <Input id="dueDate" name="dueDate" type="date" />
      </div>
      <div className="flex items-end">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Saving…" : "Create task"}
        </Button>
      </div>
      {state && !state.ok ? (
        <p className="sm:col-span-2 text-sm text-danger">{state.error}</p>
      ) : null}
    </form>
  );
}

export function FollowUpForm({ leadId }: { leadId: string }) {
  const [state, action, pending] = useActionState(createFollowUpAction, initial);
  return (
    <form action={action} className="grid gap-2 sm:grid-cols-2">
      <input type="hidden" name="leadId" value={leadId} />
      <div className="sm:col-span-2">
        <Label htmlFor="fu-title">Follow-up title</Label>
        <Input id="fu-title" name="title" required />
      </div>
      <div>
        <Label htmlFor="type">Type</Label>
        <select
          id="type"
          name="type"
          className="flex h-10 w-full rounded-xl border border-[var(--ic-border)] px-3 text-sm"
        >
          <option value="CALL">Call</option>
          <option value="MEETING">Meeting</option>
          <option value="EMAIL">Email</option>
          <option value="WHATSAPP">WhatsApp</option>
          <option value="TASK">Task</option>
        </select>
      </div>
      <div>
        <Label htmlFor="dueAt">Due</Label>
        <Input id="dueAt" name="dueAt" type="datetime-local" required />
      </div>
      <div className="sm:col-span-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Saving…" : "Schedule follow-up"}
        </Button>
      </div>
      {state && !state.ok ? (
        <p className="sm:col-span-2 text-sm text-danger">{state.error}</p>
      ) : null}
    </form>
  );
}

export function StageAssignControls({
  leadId,
  stages,
  members,
  currentStageId,
  currentAssigneeId,
  canChangeStage,
  canAssign,
  canConvert,
}: {
  leadId: string;
  stages: { id: string; name: string }[];
  members: { user: { id: string; name: string | null; email: string } }[];
  currentStageId: string | null;
  currentAssigneeId: string | null;
  canChangeStage: boolean;
  canAssign: boolean;
  canConvert: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {canChangeStage ? (
        <form
          action={async (fd) => {
            await changeLeadStageAction(leadId, String(fd.get("stageId")));
          }}
        >
          <select
            name="stageId"
            defaultValue={currentStageId ?? ""}
            className="h-9 rounded-xl border border-[var(--ic-border)] px-2 text-sm"
            onChange={(e) => e.currentTarget.form?.requestSubmit()}
          >
            <option value="" disabled>
              Stage
            </option>
            {stages.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </form>
      ) : null}
      {canAssign ? (
        <form
          action={async (fd) => {
            const value = String(fd.get("assignedUserId") ?? "");
            await assignLeadAction(leadId, value || null);
          }}
        >
          <select
            name="assignedUserId"
            defaultValue={currentAssigneeId ?? ""}
            className="h-9 rounded-xl border border-[var(--ic-border)] px-2 text-sm"
            onChange={(e) => e.currentTarget.form?.requestSubmit()}
          >
            <option value="">Unassigned</option>
            {members.map((m) => (
              <option key={m.user.id} value={m.user.id}>
                {m.user.name ?? m.user.email}
              </option>
            ))}
          </select>
        </form>
      ) : null}
      {canConvert ? (
        <form
          action={async () => {
            await changeLeadStatusAction(leadId, LeadStatus.CONVERTED);
          }}
        >
          <Button type="submit" size="sm">
            Convert
          </Button>
        </form>
      ) : null}
      <form
        action={async () => {
          await changeLeadStatusAction(leadId, LeadStatus.LOST, "Marked lost");
        }}
      >
        <Button type="submit" size="sm" variant="secondary">
          Mark lost
        </Button>
      </form>
    </div>
  );
}
