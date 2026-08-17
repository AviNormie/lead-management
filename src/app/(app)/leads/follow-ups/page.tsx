import { format } from "date-fns";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/tenant";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { completeFollowUpAction } from "@/features/leads/workflow-actions";

export default async function FollowUpsPage() {
  const tenant = await requirePermission("lead.view");
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  const items = await prisma.leadFollowUp.findMany({
    where: { organizationId: tenant.organizationId },
    include: { lead: { select: { id: true, fullName: true } } },
    orderBy: { dueAt: "asc" },
    take: 200,
  });

  const overdue = items.filter((i) => i.status === "PENDING" && i.dueAt < start);
  const today = items.filter(
    (i) => i.status === "PENDING" && i.dueAt >= start && i.dueAt <= end,
  );
  const upcoming = items.filter((i) => i.status === "PENDING" && i.dueAt > end);

  function Group({
    title,
    rows,
  }: {
    title: string;
    rows: typeof items;
  }) {
    return (
      <Card className="mb-4">
        <CardContent className="pt-5">
          <h2 className="mb-3 font-semibold">{title}</h2>
          {rows.length === 0 ? (
            <p className="text-sm text-muted">None</p>
          ) : (
            <ul className="space-y-2">
              {rows.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-3 rounded-xl bg-[var(--ic-surface-muted)] px-3 py-2 text-sm"
                >
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
                      <form action={completeFollowUpAction}>
                        <input type="hidden" name="followUpId" value={item.id} />
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
    );
  }

  return (
    <div>
      <PageHeader
        breadcrumbs={["Leads", "Follow-ups"]}
        title="Follow-ups"
        subtitle="Today, upcoming, and overdue for this organization"
      />
      <Group title="Overdue" rows={overdue} />
      <Group title="Today" rows={today} />
      <Group title="Upcoming" rows={upcoming} />
    </div>
  );
}
