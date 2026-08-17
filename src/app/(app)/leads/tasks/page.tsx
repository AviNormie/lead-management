import Link from "next/link";
import { format } from "date-fns";
import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/tenant";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { completeTaskAction } from "@/features/leads/workflow-actions";

export default async function TasksPage() {
  const tenant = await requirePermission("lead.view");
  const tasks = await prisma.leadTask.findMany({
    where: { organizationId: tenant.organizationId },
    include: { lead: { select: { id: true, fullName: true } } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <div>
      <PageHeader breadcrumbs={["Leads", "Tasks"]} title="Tasks" />
      <Card>
        <CardContent className="pt-5">
          {tasks.length === 0 ? (
            <p className="text-sm text-muted">No tasks yet.</p>
          ) : (
            <ul className="space-y-2">
              {tasks.map((task) => (
                <li
                  key={task.id}
                  className="flex items-center justify-between gap-3 rounded-xl bg-[var(--ic-surface-muted)] px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-medium">{task.title}</p>
                    <p className="text-2xs text-subtle">
                      <Link href={`/leads/${task.lead.id}`}>{task.lead.fullName}</Link>
                      {task.dueDate
                        ? ` · ${format(task.dueDate, "dd MMM yyyy")}`
                        : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      tone={task.status === "COMPLETED" ? "success" : "neutral"}
                    >
                      {task.status}
                    </Badge>
                    {task.status === "PENDING" ? (
                      <form action={completeTaskAction}>
                        <input type="hidden" name="taskId" value={task.id} />
                        <Button size="sm" variant="secondary">
                          Done
                        </Button>
                      </form>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
