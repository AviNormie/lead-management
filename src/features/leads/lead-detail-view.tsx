"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { MoreHorizontal, Phone, Mail } from "lucide-react";
import { toast } from "sonner";
import {
  archiveLeadAction,
  changeLeadStatusAction,
} from "@/features/leads/actions";
import { LeadStatus } from "@prisma/client";
import { LOST_REASONS } from "@/lib/leads/lost-reasons";
import { PageHeader } from "@/components/layout/page-header";
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
  LogActivityForm,
  NoteForm,
  StageAssignControls,
  TaskForm,
} from "@/features/leads/detail-forms";
import {
  cancelFollowUpAction,
  completeFollowUpAction,
  completeTaskAction,
  deleteNoteAction,
  deleteTaskAction,
  updateFollowUpAction,
  updateNoteAction,
} from "@/features/leads/workflow-actions";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

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
  assignedUserId: string | null;
  lostReason: string | null;
  convertedAt: string | null;
  source: { name: string } | null;
  product: { name: string } | null;
  stage: { name: string } | null;
  assignedUser: { name: string | null; email: string } | null;
  tags: { tag: { name: string } }[];
  notes: {
    id: string;
    content: string;
    createdAt: string;
    author: { name: string | null; email: string };
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
    actor: { name: string | null; email: string } | null;
  }[];
};

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
  };
  canEdit: boolean;
  canAssign: boolean;
  canStage: boolean;
  canConvert: boolean;
  canDelete: boolean;
}) {
  const router = useRouter();
  const [tab, setTab] = useState("overview");
  const [lostOpen, setLostOpen] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);
  const [lostReason, setLostReason] = useState(LOST_REASONS[0]);

  const tel = lead.phone ? `tel:${lead.phone}` : null;
  const mail = lead.email ? `mailto:${lead.email}` : null;
  const wa = lead.whatsappNumber
    ? `https://wa.me/${lead.whatsappNumber.replace(/\D/g, "")}`
    : null;

  return (
    <div>
      <PageHeader
        breadcrumbs={["Leads", lead.fullName]}
        title={lead.fullName}
        subtitle={[lead.company, lead.jobTitle].filter(Boolean).join(" · ")}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {tel ? (
              <a href={tel}>
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
              <Link href={`/leads/${lead.id}/edit`}>
                <Button variant="secondary" size="sm">
                  Edit
                </Button>
              </Link>
            ) : null}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon-sm" variant="secondary">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {canConvert ? (
                  <DropdownMenuItem onSelect={() => setConvertOpen(true)}>
                    Convert
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuItem onSelect={() => setLostOpen(true)}>
                  Mark lost
                </DropdownMenuItem>
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
        {lead.tags.map((row) => (
          <Badge key={row.tag.name} tone="neutral">
            {row.tag.name}
          </Badge>
        ))}
      </div>

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { id: "overview", label: "Overview" },
          { id: "activities", label: "Activities" },
          { id: "tasks", label: "Tasks" },
          { id: "notes", label: "Notes" },
          { id: "followups", label: "Follow-ups" },
          { id: "timeline", label: "Timeline" },
        ]}
      />

      <div className="mt-4 space-y-4">
        {tab === "overview" ? (
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 text-sm">
              <p><span className="text-muted">Email:</span> {lead.email ?? "—"}</p>
              <p><span className="text-muted">Phone:</span> {lead.phone ?? "—"}</p>
              <p><span className="text-muted">WhatsApp:</span> {lead.whatsappNumber ?? "—"}</p>
              <p><span className="text-muted">GST No:</span> {lead.gstNo ?? "—"}</p>
              <p><span className="text-muted">Website:</span> {lead.website ?? "—"}</p>
              <p><span className="text-muted">Source:</span> {lead.source?.name ?? "—"}</p>
              <p>
                <span className="text-muted">Interested in:</span>{" "}
                {lead.product?.name ?? "—"}
              </p>
              <p>
                <span className="text-muted">Address:</span>{" "}
                {[lead.address, lead.city, lead.state, lead.postalCode, lead.country]
                  .filter(Boolean)
                  .join(", ") || "—"}
              </p>
              <p><span className="text-muted">Industry:</span> {lead.industry ?? "—"}</p>
              <p>
                <span className="text-muted">Expected value:</span>{" "}
                {lead.expectedValue?.toString() ?? "—"}
              </p>
              <p className="sm:col-span-2">
                <span className="text-muted">Description:</span> {lead.description ?? "—"}
              </p>
            </CardContent>
          </Card>
        ) : null}

        {tab === "activities" ? (
          <Card>
            <CardHeader>
              <CardTitle>Log activity</CardTitle>
            </CardHeader>
            <CardContent>
              {canEdit ? <LogActivityForm leadId={lead.id} /> : <p className="text-sm text-muted">View only.</p>}
            </CardContent>
          </Card>
        ) : null}

        {tab === "notes" ? (
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {canEdit ? <NoteForm leadId={lead.id} /> : null}
              {lead.notes.map((note) => (
                <div key={note.id} className="rounded-xl bg-[var(--ic-surface-muted)] p-3 text-sm">
                  <p>{note.content}</p>
                  <p className="mt-1 text-2xs text-subtle">
                    {note.author.name ?? note.author.email} · {format(new Date(note.createdAt), "dd MMM yyyy HH:mm")}
                  </p>
                  {canEdit ? (
                    <form
                      className="mt-2 space-y-2"
                      action={async (fd) => {
                        fd.set("noteId", note.id);
                        const result = await updateNoteAction(null, fd);
                        if (!result.ok) toast.error(result.error);
                        else {
                          toast.success("Note updated");
                          router.refresh();
                        }
                      }}
                    >
                      <Textarea name="content" rows={2} defaultValue={note.content} />
                      <div className="flex gap-2">
                        <Button size="sm" variant="secondary">Save</Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          formAction={async () => {
                            const fd = new FormData();
                            fd.set("noteId", note.id);
                            await deleteNoteAction(fd);
                            router.refresh();
                          }}
                        >
                          Delete
                        </Button>
                      </div>
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

        {tab === "timeline" ? (
          <Card>
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {lead.activities.length === 0 ? (
                <p className="text-sm text-muted">No activity yet.</p>
              ) : (
                <ol className="space-y-3">
                  {lead.activities.map((item) => (
                    <li key={item.id} className="border-l-2 border-[var(--ic-border)] pl-3 text-sm">
                      <p className="font-medium">{item.message}</p>
                      <p className="text-2xs text-subtle">
                        {item.actor?.name ?? item.actor?.email ?? "System"} ·{" "}
                        {format(new Date(item.createdAt), "dd MMM yyyy HH:mm")} · {item.type}
                      </p>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        ) : null}
      </div>

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
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setLostOpen(false)}>Cancel</Button>
            <Button
              variant="danger"
              onClick={async () => {
                const result = await changeLeadStatusAction(lead.id, LeadStatus.LOST, lostReason);
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
