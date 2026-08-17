import Link from "next/link";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { prisma } from "@/lib/db/prisma";
import { hasPermission, requirePermission } from "@/lib/tenant";
import { getLeadLookups } from "@/features/leads/queries";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  FollowUpForm,
  NoteForm,
  StageAssignControls,
  TaskForm,
} from "@/features/leads/detail-forms";
import {
  completeFollowUpAction,
  completeTaskAction,
} from "@/features/leads/workflow-actions";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const tenant = await requirePermission("lead.view");
  const { id } = await params;
  const [lead, lookups] = await Promise.all([
    prisma.lead.findFirst({
      where: { id, organizationId: tenant.organizationId },
      include: {
        source: true,
        stage: true,
        assignedUser: true,
        notes: { include: { author: true }, orderBy: { createdAt: "desc" } },
        tasks: { orderBy: { createdAt: "desc" } },
        followUps: { orderBy: { dueAt: "asc" } },
        activities: {
          include: { actor: true },
          orderBy: { createdAt: "desc" },
          take: 50,
        },
      },
    }),
    getLeadLookups(tenant.organizationId),
  ]);
  if (!lead) notFound();

  const canEdit = hasPermission(tenant, "lead.edit");
  const canAssign = hasPermission(tenant, "lead.assign");
  const canStage = hasPermission(tenant, "lead.change_stage");
  const canConvert = hasPermission(tenant, "lead.convert");

  return (
    <div>
      <PageHeader
        breadcrumbs={["Leads", lead.fullName]}
        title={lead.fullName}
        subtitle={[lead.company, lead.jobTitle].filter(Boolean).join(" · ")}
        actions={
          <>
            {canEdit ? (
              <Link href={`/leads/${lead.id}/edit`}>
                <Button variant="secondary" size="sm">
                  Edit
                </Button>
              </Link>
            ) : null}
            <StageAssignControls
              leadId={lead.id}
              stages={lookups.stages}
              members={lookups.members}
              currentStageId={lead.stageId}
              currentAssigneeId={lead.assignedUserId}
              canChangeStage={canStage}
              canAssign={canAssign}
              canConvert={canConvert}
            />
          </>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <Badge tone="primary">{lead.status}</Badge>
        <Badge tone="neutral">{lead.stage?.name ?? "No stage"}</Badge>
        <Badge tone="neutral">{lead.priority}</Badge>
        <Badge tone="neutral">Score {lead.leadScore}</Badge>
        {lead.assignedUser ? (
          <Badge tone="neutral">
            {lead.assignedUser.name ?? lead.assignedUser.email}
          </Badge>
        ) : null}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2 text-sm">
              <p>
                <span className="text-muted">Email:</span> {lead.email ?? "—"}
              </p>
              <p>
                <span className="text-muted">Phone:</span> {lead.phone ?? "—"}
              </p>
              <p>
                <span className="text-muted">WhatsApp:</span>{" "}
                {lead.whatsappNumber ?? "—"}
              </p>
              <p>
                <span className="text-muted">Source:</span>{" "}
                {lead.source?.name ?? "—"}
              </p>
              <p>
                <span className="text-muted">City:</span> {lead.city ?? "—"}
              </p>
              <p>
                <span className="text-muted">Expected value:</span>{" "}
                {lead.expectedValue?.toString() ?? "—"}
              </p>
              <p className="sm:col-span-2">
                <span className="text-muted">Description:</span>{" "}
                {lead.description ?? "—"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Activity timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {lead.activities.length === 0 ? (
                <p className="text-sm text-muted">No activity yet.</p>
              ) : (
                <ol className="space-y-3">
                  {lead.activities.map((item) => (
                    <li
                      key={item.id}
                      className="border-l-2 border-[var(--ic-border)] pl-3 text-sm"
                    >
                      <p className="font-medium">{item.message}</p>
                      <p className="text-2xs text-subtle">
                        {item.actor?.name ?? item.actor?.email ?? "System"} ·{" "}
                        {format(item.createdAt, "dd MMM yyyy HH:mm")} · {item.type}
                      </p>
                    </li>
                  ))}
                </ol>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {canEdit ? (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <NoteForm leadId={lead.id} />
                {lead.notes.slice(0, 5).map((note) => (
                  <div
                    key={note.id}
                    className="rounded-xl bg-[var(--ic-surface-muted)] p-3 text-sm"
                  >
                    <p>{note.content}</p>
                    <p className="mt-1 text-2xs text-subtle">
                      {note.author.name ?? note.author.email} ·{" "}
                      {format(note.createdAt, "dd MMM yyyy HH:mm")}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}

          {canEdit ? (
            <Card>
              <CardHeader>
                <CardTitle>Follow-ups</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <FollowUpForm leadId={lead.id} />
                {lead.followUps.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-2 rounded-xl bg-[var(--ic-surface-muted)] px-3 py-2 text-sm"
                  >
                    <div>
                      <p className="font-medium">{item.title}</p>
                      <p className="text-2xs text-subtle">
                        {item.type} · {format(item.dueAt, "dd MMM yyyy HH:mm")} ·{" "}
                        {item.status}
                      </p>
                    </div>
                    {item.status === "PENDING" ? (
                      <form action={completeFollowUpAction}>
                        <input type="hidden" name="followUpId" value={item.id} />
                        <Button size="sm" variant="secondary">
                          Done
                        </Button>
                      </form>
                    ) : null}
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}

          {canEdit ? (
            <Card>
              <CardHeader>
                <CardTitle>Tasks</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <TaskForm leadId={lead.id} />
                {lead.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between gap-2 rounded-xl bg-[var(--ic-surface-muted)] px-3 py-2 text-sm"
                  >
                    <div>
                      <p className="font-medium">{task.title}</p>
                      <p className="text-2xs text-subtle">{task.status}</p>
                    </div>
                    {task.status === "PENDING" ? (
                      <form action={completeTaskAction}>
                        <input type="hidden" name="taskId" value={task.id} />
                        <Button size="sm" variant="secondary">
                          Done
                        </Button>
                      </form>
                    ) : null}
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
