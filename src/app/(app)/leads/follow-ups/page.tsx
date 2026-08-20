import { format } from "date-fns";
import Link from "next/link";
import { requirePermission } from "@/lib/tenant";
import { listFollowUps } from "@/features/leads/queries";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  cancelFollowUpAction,
  completeFollowUpAction,
  updateFollowUpFormAction,
} from "@/features/leads/workflow-actions";

export default async function FollowUpsPage() {
  const tenant = await requirePermission("lead.view");
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  const items = await listFollowUps(tenant);
  const overdue = items.filter((i) => i.status === "PENDING" && i.dueAt < start);
  const today = items.filter(
    (i) => i.status === "PENDING" && i.dueAt >= start && i.dueAt <= end,
  );
  const upcoming = items.filter((i) => i.status === "PENDING" && i.dueAt > end);

  function Group({ title, rows }: { title: string; rows: typeof items }) {
    return (
      <Card className="mb-4">
        <CardContent className="pt-5">
          <h2 className="mb-3 font-semibold">{title}</h2>
          {rows.length === 0 ? (
            <p className="text-sm text-muted">None</p>
          ) : (
            <ul className="space-y-3">
              {rows.map((item) => (
                <li
                  key={item.id}
                  className="rounded-xl bg-[var(--ic-surface-muted)] px-3 py-3 text-sm"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <Link href={`/leads/${item.lead.id}`} className="font-medium">
                        {item.title}
                      </Link>
                      <p className="text-2xs text-subtle">
                        {item.lead.fullName} · {format(item.dueAt, "dd MMM yyyy HH:mm")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone={item.dueAt < start ? "danger" : "neutral"}>
                        {item.dueAt < start ? "OVERDUE" : item.status}
                      </Badge>
                      {item.status === "PENDING" ? (
                        <>
                          <form action={completeFollowUpAction}>
                            <input type="hidden" name="followUpId" value={item.id} />
                            <Button size="sm" variant="secondary">Done</Button>
                          </form>
                          <form action={cancelFollowUpAction}>
                            <input type="hidden" name="followUpId" value={item.id} />
                            <Button size="sm" variant="ghost">Cancel</Button>
                          </form>
                        </>
                      ) : null}
                    </div>
                  </div>
                  {item.status === "PENDING" ? (
                    <form action={updateFollowUpFormAction} className="mt-2 flex flex-wrap gap-2">
                      <input type="hidden" name="followUpId" value={item.id} />
                      <input type="hidden" name="title" value={item.title} />
                      <input type="hidden" name="type" value={item.type} />
                      <Input
                        name="dueAt"
                        type="datetime-local"
                        defaultValue={format(item.dueAt, "yyyy-MM-dd'T'HH:mm")}
                        className="h-8 max-w-xs"
                      />
                      <Button size="sm" variant="secondary">Reschedule</Button>
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
      <PageHeader
        breadcrumbs={["Leads", "Follow-ups"]}
        title="Follow-ups"
        subtitle="Today, upcoming, and overdue"
      />
      <Group title="Overdue" rows={overdue} />
      <Group title="Today" rows={today} />
      <Group title="Upcoming" rows={upcoming} />
    </div>
  );
}
