"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { MoreHorizontal, Phone, Mail, RefreshCw, ArrowRightLeft } from "lucide-react";
import { toast } from "sonner";
import {
  archiveLeadAction,
  changeLeadStatusAction,
} from "@/features/leads/actions";
import { reengageLeadAction, createCallRecordAction } from "@/features/leads/call-actions";
import { transferLeadAction } from "@/features/leads/transfer-actions";
import { LeadStatus } from "@prisma/client";
import { LOST_REASONS } from "@/lib/leads/lost-reasons";
import { CALL_OUTCOMES } from "@/lib/leads/call-outcomes";
import { PageHeader } from "@/components/layout/page-header";
import { ModulePlaceholder } from "@/components/leads/module-placeholder";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Tabs } from "@/components/ui/tabs";
import { Select } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FollowUpForm,
  NoteForm,
  StageAssignControls,
  TaskForm,
} from "@/features/leads/detail-forms";
import { LeadDialUpdateDialog } from "@/features/leads/lead-dial-update-dialog";
import {
  cancelFollowUpAction,
  completeFollowUpAction,
  completeTaskAction,
  deleteTaskAction,
  updateFollowUpAction,
} from "@/features/leads/workflow-actions";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type LeadDetail = {
  id: string;
  fullName: string;
  firstName: string | null;
  lastName: string | null;
  company: string | null;
  jobTitle: string | null;
  email: string | null;
  phone: string | null;
  whatsappNumber: string | null;
  website: string | null;
  gstNo: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
  industry: string | null;
  status: string;
  priority: string;
  leadScore: number;
  expectedValue: string | number | null;
  description: string | null;
  stageId: string | null;
  pipelineId: string | null;
  sourceId: string | null;
  assignedUserId: string | null;
  lostReason: string | null;
  lostComment: string | null;
  convertedAt: string | null;
  reEngagedAt: string | null;
  callbackAt: string | null;
  nextFollowUpAt: string | null;
  source: { name: string } | null;
  product: { name: string } | null;
  stage: { name: string } | null;
  assignedUser: { name: string | null; email: string } | null;
  assignedTeam: { name: string } | null;
  tags: { tag: { name: string } }[];
  flags: { flag: { key: string; label: string; color: string | null } }[];
  customFieldValues: {
    fieldId: string;
    value: string | null;
    field: {
      id: string;
      key: string;
      label: string;
      type: string;
      section: string;
      options: unknown;
    };
  }[];
  notes: {
    id: string;
    content: string;
    createdAt: string;
    author: { name: string | null; email: string };
  }[];
  callRecords: {
    id: string;
    calledAt: string;
    durationSec: number | null;
    phoneNumber: string | null;
    outcome: string | null;
    notes: string | null;
    callbackAt: string | null;
    user: { name: string | null; email: string };
  }[];
  tasks: {
    id: string;
    title: string;
    status: string;
    dueDate: string | null;
  }[];
  followUps: {
    id: string;
    title: string;
    type: string;
    status: string;
    dueAt: string;
  }[];
  activities: {
    id: string;
    type: string;
    message: string;
    createdAt: string;
    previous: unknown;
    next: unknown;
    actor: { name: string | null; email: string } | null;
  }[];
  transfers: {
    id: string;
    reason: string | null;
    createdAt: string;
    fromUser: { name: string | null; email: string } | null;
    toUser: { name: string | null; email: string } | null;
  }[];
  reengagements: {
    id: string;
    reEngagedAt: string;
    reason: string | null;
    notes: string | null;
    createdBy: { name: string | null; email: string };
  }[];
};

type NoteCallRow =
  | {
      kind: "note";
      id: string;
      at: string;
      author: string;
      summary: string;
      detail: string | null;
    }
  | {
      kind: "call";
      id: string;
      at: string;
      author: string;
      summary: string;
      detail: string | null;
    };

function formatJson(value: unknown) {
  if (value == null) return null;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function LeadDetailView({
  lead,
  lookups,
  canEdit,
  canAssign,
  canStage,
  canConvert,
  canDelete,
}: {
  lead: LeadDetail;
  lookups: {
    stages: { id: string; name: string }[];
    members: { user: { id: string; name: string | null; email: string } }[];
    customFields?: {
      id: string;
      key: string;
      label: string;
      type: string;
      section: string;
      options: unknown;
    }[];
  };
  canEdit: boolean;
  canAssign: boolean;
  canStage: boolean;
  canConvert: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [tab, setTab] = useState("notes-calls");
  const [lostOpen, setLostOpen] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);
  const [reengageOpen, setReengageOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [dialOpen, setDialOpen] = useState(false);
  const [lostReason, setLostReason] = useState(LOST_REASONS[0]);
  const [lostComment, setLostComment] = useState("");
  const [transferTo, setTransferTo] = useState(lookups.members[0]?.user.id ?? "");
  const [transferReason, setTransferReason] = useState("");

  const tel = lead.phone ? `tel:${lead.phone}` : null;
  const mail = lead.email ? `mailto:${lead.email}` : null;
  const wa = lead.whatsappNumber
    ? `https://wa.me/${lead.whatsappNumber.replace(/\D/g, "")}`
    : null;

  const noteCallRows = useMemo<NoteCallRow[]>(() => {
    const notes: NoteCallRow[] = lead.notes.map((note) => ({
      kind: "note",
      id: note.id,
      at: note.createdAt,
      author: note.author.name ?? note.author.email,
      summary: note.content,
      detail: null,
    }));
    const calls: NoteCallRow[] = lead.callRecords.map((call) => ({
      kind: "call",
      id: call.id,
      at: call.calledAt,
      author: call.user.name ?? call.user.email,
      summary: call.outcome ?? "Call logged",
      detail: [call.notes, call.phoneNumber, call.durationSec ? `${call.durationSec}s` : null]
        .filter(Boolean)
        .join(" · ") || null,
    }));
    return [...notes, ...calls].sort(
      (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
    );
  }, [lead.notes, lead.callRecords]);

  const customFields = lookups.customFields ?? [];

  return (
    <div>
      <PageHeader
        breadcrumbs={["Leads", lead.fullName]}
        title={lead.fullName}
        subtitle={[lead.company, lead.jobTitle].filter(Boolean).join(" · ")}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {tel ? (
              <a href={tel} onClick={() => canEdit && setDialOpen(true)}>
                <Button size="sm" variant="secondary">
                  <Phone className="h-3.5 w-3.5" />
                  Call
                </Button>
              </a>
            ) : null}
            {wa ? (
              <a href={wa} target="_blank" rel="noreferrer">
                <Button size="sm" variant="secondary">
                  WhatsApp
                </Button>
              </a>
            ) : null}
            {mail ? (
              <a href={mail}>
                <Button size="sm" variant="secondary">
                  <Mail className="h-3.5 w-3.5" />
                  Email
                </Button>
              </a>
            ) : null}
            {canEdit ? (
              <Button size="sm" variant="secondary" onClick={() => setReengageOpen(true)}>
                <RefreshCw className="h-3.5 w-3.5" />
                Re-engage
              </Button>
            ) : null}
            {canAssign ? (
              <Button size="sm" variant="secondary" onClick={() => setTransferOpen(true)}>
                <ArrowRightLeft className="h-3.5 w-3.5" />
                Transfer
              </Button>
            ) : null}
            {canEdit ? (
              <Link href={`/leads/${lead.id}/edit`}>
                <Button variant="secondary" size="sm">
                  Edit
                </Button>
              </Link>
            ) : null}
            {canConvert ? (
              <Button size="sm" onClick={() => setConvertOpen(true)}>
                Convert
              </Button>
            ) : null}
            <Button size="sm" variant="danger" onClick={() => setLostOpen(true)}>
              Lost
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon-sm" variant="secondary">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {canDelete ? (
                  <DropdownMenuItem
                    onSelect={async () => {
                      const result = await archiveLeadAction(lead.id);
                      if (result.ok) {
                        toast.success("Lead archived");
                        router.push("/leads");
                      } else toast.error(result.error);
                    }}
                  >
                    Archive
                  </DropdownMenuItem>
                ) : null}
              </DropdownMenuContent>
            </DropdownMenu>
            <StageAssignControls
              leadId={lead.id}
              stages={lookups.stages}
              members={lookups.members}
              currentStageId={lead.stageId}
              currentAssigneeId={lead.assignedUserId}
              canChangeStage={canStage}
              canAssign={canAssign}
              canConvert={false}
            />
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Avatar name={lead.fullName} />
        <Badge tone="primary">{lead.status}</Badge>
        <Badge tone="neutral">{lead.stage?.name ?? "No stage"}</Badge>
        <Badge tone="neutral">{lead.priority}</Badge>
        <Badge tone="neutral">Score {lead.leadScore}</Badge>
        {lead.assignedUser ? (
          <Badge tone="neutral">{lead.assignedUser.name ?? lead.assignedUser.email}</Badge>
        ) : null}
        {lead.assignedTeam ? (
          <Badge tone="neutral">{lead.assignedTeam.name}</Badge>
        ) : null}
        {lead.callbackAt ? (
          <Badge tone="neutral">
            Callback {format(new Date(lead.callbackAt), "dd MMM yyyy HH:mm")}
          </Badge>
        ) : null}
        {lead.reEngagedAt ? (
          <Badge tone="primary">
            Re-engaged {format(new Date(lead.reEngagedAt), "dd MMM yyyy")}
          </Badge>
        ) : null}
        {lead.lostReason ? (
          <Badge tone="danger">Lost: {lead.lostReason}</Badge>
        ) : null}
        {lead.lostComment ? (
          <Badge tone="danger">{lead.lostComment}</Badge>
        ) : null}
        {lead.flags.map((row) => (
          <Badge key={row.flag.key} tone="neutral">
            {row.flag.label}
          </Badge>
        ))}
        {lead.tags.map((row) => (
          <Badge key={row.tag.name} tone="neutral">
            {row.tag.name}
          </Badge>
        ))}
      </div>

      <Card className="mb-4">
        <CardContent className="grid gap-3 pt-5 sm:grid-cols-2 text-sm">
          <p><span className="text-muted">Email:</span> {lead.email ?? "—"}</p>
          <p><span className="text-muted">Phone:</span> {lead.phone ?? "—"}</p>
          <p><span className="text-muted">WhatsApp:</span> {lead.whatsappNumber ?? "—"}</p>
          <p><span className="text-muted">Source:</span> {lead.source?.name ?? "—"}</p>
          <p>
            <span className="text-muted">Interested in:</span>{" "}
            {lead.product?.name ?? "—"}
          </p>
          <p>
            <span className="text-muted">Expected value:</span>{" "}
            {lead.expectedValue?.toString() ?? "—"}
          </p>
        </CardContent>
      </Card>

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { id: "notes-calls", label: "Notes & Call Records" },
          { id: "history", label: "History" },
          { id: "followups", label: "Follow-ups" },
          { id: "tasks", label: "Tasks" },
          { id: "site-visits", label: "Site Visits" },
          { id: "quotations", label: "Quotations" },
          { id: "documents", label: "Documents" },
        ]}
      />

      <div className="mt-4 space-y-4">
        {tab === "notes-calls" ? (
          <Card>
            <CardHeader>
              <CardTitle>Notes & call records</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {canEdit ? (
                <div className="grid gap-4 lg:grid-cols-2">
                  <div>
                    <p className="mb-2 text-sm font-medium">Add note</p>
                    <NoteForm leadId={lead.id} />
                  </div>
                  <form
                    className="space-y-2"
                    action={async (fd) => {
                      fd.set("leadId", lead.id);
                      const result = await createCallRecordAction(fd);
                      if (!result.ok) toast.error(result.error);
                      else {
                        toast.success("Call recorded");
                        router.refresh();
                      }
                    }}
                  >
                    <p className="text-sm font-medium">Log call</p>
                    <input type="hidden" name="leadId" value={lead.id} />
                    <div>
                      <Label htmlFor="call-outcome">Outcome</Label>
                      <Select id="call-outcome" name="outcome" defaultValue="">
                        <option value="">—</option>
                        {CALL_OUTCOMES.map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="call-notes">Notes</Label>
                      <Textarea id="call-notes" name="notes" rows={2} />
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="call-at">Called at</Label>
                        <Input id="call-at" name="calledAt" type="datetime-local" />
                      </div>
                      <div>
                        <Label htmlFor="call-callback">Callback</Label>
                        <Input id="call-callback" name="callbackAt" type="datetime-local" />
                      </div>
                    </div>
                    <Button size="sm" type="submit">Log call</Button>
                  </form>
                </div>
              ) : null}

              {noteCallRows.length === 0 ? (
                <p className="text-sm text-muted">No notes or call records yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[560px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-[var(--ic-border)] text-2xs text-subtle">
                        <th className="px-2 py-2 font-medium">Date</th>
                        <th className="px-2 py-2 font-medium">Type</th>
                        <th className="px-2 py-2 font-medium">By</th>
                        <th className="px-2 py-2 font-medium">Summary</th>
                        <th className="px-2 py-2 font-medium">Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {noteCallRows.map((row) => (
                        <tr key={`${row.kind}-${row.id}`} className="border-b border-[var(--ic-border)]/60">
                          <td className="px-2 py-2 whitespace-nowrap">
                            {format(new Date(row.at), "dd MMM yyyy HH:mm")}
                          </td>
                          <td className="px-2 py-2 capitalize">{row.kind}</td>
                          <td className="px-2 py-2">{row.author}</td>
                          <td className="px-2 py-2 max-w-xs">{row.summary}</td>
                          <td className="px-2 py-2 text-muted">{row.detail ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

            </CardContent>
          </Card>
        ) : null}

        {tab === "history" ? (
          <Card>
            <CardHeader>
              <CardTitle>Activity history</CardTitle>
            </CardHeader>
            <CardContent>
              {lead.activities.length === 0 ? (
                <p className="text-sm text-muted">No activity yet.</p>
              ) : (
                <ol className="space-y-4">
                  {lead.activities.map((item) => {
                    const previous = formatJson(item.previous);
                    const next = formatJson(item.next);
                    return (
                      <li
                        key={item.id}
                        className="rounded-xl border border-[var(--ic-border)] p-3 text-sm"
                      >
                        <p className="font-medium">{item.message}</p>
                        <p className="mt-1 text-2xs text-subtle">
                          {item.actor?.name ?? item.actor?.email ?? "System"} ·{" "}
                          {format(new Date(item.createdAt), "dd MMM yyyy HH:mm")} · {item.type}
                        </p>
                        {(previous || next) ? (
                          <div className="mt-3 grid gap-3 lg:grid-cols-2">
                            {previous ? (
                              <div>
                                <p className="mb-1 text-2xs font-medium text-subtle">Previous</p>
                                <pre className="overflow-x-auto rounded-lg bg-[var(--ic-surface-muted)] p-2 text-2xs">
                                  {previous}
                                </pre>
                              </div>
                            ) : null}
                            {next ? (
                              <div>
                                <p className="mb-1 text-2xs font-medium text-subtle">Next</p>
                                <pre className="overflow-x-auto rounded-lg bg-[var(--ic-surface-muted)] p-2 text-2xs">
                                  {next}
                                </pre>
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                      </li>
                    );
                  })}
                </ol>
              )}
            </CardContent>
          </Card>
        ) : null}

        {tab === "followups" ? (
          <Card>
            <CardHeader>
              <CardTitle>Follow-ups</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {canEdit ? <FollowUpForm leadId={lead.id} /> : null}
              {lead.followUps.map((item) => (
                <div key={item.id} className="rounded-xl bg-[var(--ic-surface-muted)] p-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-2xs text-subtle">
                        {item.type} · {format(new Date(item.dueAt), "dd MMM yyyy HH:mm")} · {item.status}
                      </p>
                    </div>
                    {canEdit && item.status === "PENDING" ? (
                      <div className="flex gap-2">
                        <form action={completeFollowUpAction}>
                          <input type="hidden" name="followUpId" value={item.id} />
                          <Button size="sm" variant="secondary">Done</Button>
                        </form>
                        <form
                          action={async () => {
                            const fd = new FormData();
                            fd.set("followUpId", item.id);
                            await cancelFollowUpAction(fd);
                            router.refresh();
                          }}
                        >
                          <Button size="sm" variant="ghost">Cancel</Button>
                        </form>
                      </div>
                    ) : null}
                  </div>
                  {canEdit && item.status === "PENDING" ? (
                    <form
                      className="mt-2 grid gap-2 sm:grid-cols-2"
                      action={async (fd) => {
                        fd.set("followUpId", item.id);
                        const result = await updateFollowUpAction(null, fd);
                        if (!result.ok) toast.error(result.error);
                        else {
                          toast.success("Rescheduled");
                          router.refresh();
                        }
                      }}
                    >
                      <Input name="title" defaultValue={item.title} />
                      <Input
                        name="dueAt"
                        type="datetime-local"
                        defaultValue={format(new Date(item.dueAt), "yyyy-MM-dd'T'HH:mm")}
                      />
                      <input type="hidden" name="type" value={item.type} />
                      <Button size="sm" variant="secondary">Reschedule</Button>
                    </form>
                  ) : null}
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}

        {tab === "tasks" ? (
          <Card>
            <CardHeader>
              <CardTitle>Tasks</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {canEdit ? <TaskForm leadId={lead.id} /> : null}
              {lead.tasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between gap-2 rounded-xl bg-[var(--ic-surface-muted)] px-3 py-2 text-sm">
                  <div>
                    <p className="font-medium">{task.title}</p>
                    <p className="text-2xs text-subtle">
                      {task.status}
                      {task.dueDate ? ` · ${format(new Date(task.dueDate), "dd MMM yyyy")}` : ""}
                    </p>
                  </div>
                  {canEdit && task.status === "PENDING" ? (
                    <div className="flex gap-2">
                      <form action={completeTaskAction}>
                        <input type="hidden" name="taskId" value={task.id} />
                        <Button size="sm" variant="secondary">Done</Button>
                      </form>
                      <form
                        action={async () => {
                          const fd = new FormData();
                          fd.set("taskId", task.id);
                          await deleteTaskAction(fd);
                          router.refresh();
                        }}
                      >
                        <Button size="sm" variant="ghost">Delete</Button>
                      </form>
                    </div>
                  ) : null}
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}

        {tab === "site-visits" ? <ModulePlaceholder title="Site Visits" /> : null}
        {tab === "quotations" ? <ModulePlaceholder title="Quotations" /> : null}
        {tab === "documents" ? <ModulePlaceholder title="Documents" /> : null}
      </div>

      <LeadDialUpdateDialog
        lead={lead}
        stages={lookups.stages}
        customFields={customFields}
        open={dialOpen}
        onOpenChange={setDialOpen}
      />

      <Dialog open={reengageOpen} onOpenChange={setReengageOpen}>
        <DialogContent>
          <DialogTitle>Re-engage lead</DialogTitle>
          <DialogDescription>
            Reopen or restart outreach for this lead.
          </DialogDescription>
          <form
            className="mt-4 space-y-3"
            action={async (fd) => {
              fd.set("leadId", lead.id);
              const result = await reengageLeadAction(fd);
              if (!result.ok) toast.error(result.error);
              else {
                toast.success("Lead re-engaged");
                setReengageOpen(false);
                router.refresh();
              }
            }}
          >
            <input type="hidden" name="leadId" value={lead.id} />
            <div>
              <Label htmlFor="reengage-reason">Reason</Label>
              <Input id="reengage-reason" name="reason" />
            </div>
            <div>
              <Label htmlFor="reengage-notes">Notes</Label>
              <Textarea id="reengage-notes" name="notes" rows={2} />
            </div>
            <div>
              <Label htmlFor="reengage-stage">Stage</Label>
              <Select id="reengage-stage" name="stageId" defaultValue={lead.stageId ?? ""}>
                <option value="">Keep current</option>
                {lookups.stages.map((stage) => (
                  <option key={stage.id} value={stage.id}>
                    {stage.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="reengage-assignee">Assignee</Label>
              <Select
                id="reengage-assignee"
                name="assignedUserId"
                defaultValue={lead.assignedUserId ?? ""}
              >
                <option value="">Keep current</option>
                {lookups.members.map((member) => (
                  <option key={member.user.id} value={member.user.id}>
                    {member.user.name ?? member.user.email}
                  </option>
                ))}
              </Select>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="reengage-next-call">Next call due</Label>
                <Input id="reengage-next-call" name="nextCallDueAt" type="datetime-local" />
              </div>
              <div>
                <Label htmlFor="reengage-follow-up">Follow-up</Label>
                <Input id="reengage-follow-up" name="followUpAt" type="datetime-local" />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="secondary" onClick={() => setReengageOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Re-engage</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
        <DialogContent>
          <DialogTitle>Transfer lead</DialogTitle>
          <DialogDescription>Assign this lead to another team member.</DialogDescription>
          <div className="mt-4 space-y-3">
            <div>
              <Label htmlFor="transfer-to">Transfer to</Label>
              <Select
                id="transfer-to"
                value={transferTo}
                onChange={(e) => setTransferTo(e.target.value)}
              >
                {lookups.members.map((member) => (
                  <option key={member.user.id} value={member.user.id}>
                    {member.user.name ?? member.user.email}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="transfer-reason">Reason</Label>
              <Textarea
                id="transfer-reason"
                rows={2}
                value={transferReason}
                onChange={(e) => setTransferReason(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setTransferOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  if (!transferTo) {
                    toast.error("Select an assignee");
                    return;
                  }
                  const result = await transferLeadAction(
                    lead.id,
                    transferTo,
                    transferReason,
                  );
                  if (result.ok) {
                    toast.success("Lead transferred");
                    setTransferOpen(false);
                    router.refresh();
                  } else toast.error(result.error);
                }}
              >
                Transfer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={lostOpen} onOpenChange={setLostOpen}>
        <DialogContent>
          <DialogTitle>Mark lead lost</DialogTitle>
          <DialogDescription>A lost reason is required.</DialogDescription>
          <Select value={lostReason} onChange={(e) => setLostReason(e.target.value as typeof lostReason)}>
            {LOST_REASONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </Select>
          <div className="mt-3">
            <Label htmlFor="lost-comment">Comment</Label>
            <Textarea
              id="lost-comment"
              rows={2}
              value={lostComment}
              onChange={(e) => setLostComment(e.target.value)}
            />
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setLostOpen(false)}>Cancel</Button>
            <Button
              variant="danger"
              onClick={async () => {
                const result = await changeLeadStatusAction(
                  lead.id,
                  LeadStatus.LOST,
                  lostReason,
                  lostComment,
                );
                if (result.ok) {
                  toast.success("Lead marked lost");
                  setLostOpen(false);
                  router.refresh();
                } else toast.error(result.error);
              }}
            >
              Confirm
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={convertOpen} onOpenChange={setConvertOpen}>
        <DialogContent>
          <DialogTitle>Convert this lead?</DialogTitle>
          <DialogDescription>
            This marks the lead converted and keeps the history. Customer records are not created in this phase.
          </DialogDescription>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setConvertOpen(false)}>Cancel</Button>
            <Button
              onClick={async () => {
                const result = await changeLeadStatusAction(lead.id, LeadStatus.CONVERTED);
                if (result.ok) {
                  toast.success("Lead converted");
                  setConvertOpen(false);
                  router.refresh();
                } else toast.error(result.error);
              }}
            >
              Convert
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
