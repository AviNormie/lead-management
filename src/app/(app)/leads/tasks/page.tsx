import Link from "next/link";
import { format } from "date-fns";
import { requirePermission } from "@/lib/tenant";
import { listTasks } from "@/features/leads/queries";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  completeTaskAction,
  deleteTaskAction,
  updateTaskFormAction,
} from "@/features/leads/workflow-actions";

export default async function TasksPage() {
  const tenant = await requirePermission("lead.view");
  const tasks = await listTasks(tenant);
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  const pending = tasks.filter((t) => t.status === "PENDING");
  const overdue = pending.filter((t) => t.dueDate && t.dueDate < start);
  const today = pending.filter(
    (t) => t.dueDate && t.dueDate >= start && t.dueDate <= end,
  );
  const upcoming = pending.filter((t) => !t.dueDate || t.dueDate > end);

  function Group({ title, rows }: { title: string; rows: typeof tasks }) {
    return (
      <Card className="mb-4">
        <CardContent className="pt-5">
          <h2 className="mb-3 font-semibold">{title}</h2>
          {rows.length === 0 ? (
            <p className="text-sm text-muted">None</p>
          ) : (
            <ul className="space-y-3">
              {rows.map((task) => (
                <li
                  key={task.id}
                  className="rounded-xl bg-[var(--ic-surface-muted)] px-3 py-3 text-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{task.title}</p>
                      <p className="text-2xs text-subtle">
                        <Link href={`/leads/${task.lead.id}`}>{task.lead.fullName}</Link>
                        {task.dueDate ? ` · ${format(task.dueDate, "dd MMM yyyy")}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone={task.status === "COMPLETED" ? "success" : "neutral"}>
                        {task.status}
                      </Badge>
                      {task.status === "PENDING" ? (
                        <>
                          <form action={completeTaskAction}>
                            <input type="hidden" name="taskId" value={task.id} />
                            <Button size="sm" variant="secondary">Done</Button>
                          </form>
                          <form action={deleteTaskAction}>
                            <input type="hidden" name="taskId" value={task.id} />
                            <Button size="sm" variant="ghost">Delete</Button>
                          </form>
                        </>
                      ) : null}
                    </div>
                  </div>
                  {task.status === "PENDING" ? (
                    <form action={updateTaskFormAction} className="mt-2 flex flex-wrap gap-2">
                      <input type="hidden" name="taskId" value={task.id} />
                      <Input name="title" defaultValue={task.title} className="h-8 max-w-xs" />
                      <Input
                        name="dueDate"
                        type="date"
                        defaultValue={task.dueDate ? format(task.dueDate, "yyyy-MM-dd") : ""}
                        className="h-8 w-40"
                      />
                      <Button size="sm" variant="secondary">Save</Button>
                    </form>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div>
      <PageHeader breadcrumbs={["Leads", "Tasks"]} title="Tasks" subtitle="Today, upcoming, and overdue" />
      <Group title="Overdue" rows={overdue} />
      <Group title="Today" rows={today} />
      <Group title="Upcoming" rows={upcoming} />
    </div>
  );
}
