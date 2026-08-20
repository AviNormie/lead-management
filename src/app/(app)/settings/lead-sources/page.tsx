import { hasPermission, requirePermission } from "@/lib/tenant";
import { prisma } from "@/lib/db/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createLeadSourceAction,
  toggleLeadSourceAction,
  updateLeadSourceAction,
} from "@/features/leads/settings-actions";

export default async function SettingsLeadSourcesPage() {
  const tenant = await requirePermission("lead.view");
  const canManage = hasPermission(tenant, "lead.manage_sources");
  const sources = await prisma.leadSource.findMany({
    where: { organizationId: tenant.organizationId },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <PageHeader
        breadcrumbs={["Settings", "Lead sources"]}
        title="Lead sources"
        subtitle="Active sources appear on the lead form."
      />
      {canManage ? (
        <Card className="mb-4">
          <CardContent className="pt-5">
            <form action={createLeadSourceAction} className="flex flex-wrap gap-2">
              <Input name="name" placeholder="Source name" required className="max-w-xs" />
              <Input name="code" placeholder="Code (optional)" className="max-w-[160px]" />
              <Button type="submit" size="sm">Add source</Button>
            </form>
          </CardContent>
        </Card>
      ) : null}
      <Card>
        <CardContent className="pt-5">
          <ul className="grid gap-2">
            {sources.map((source) => (
              <li
                key={source.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[var(--ic-surface-muted)] px-3 py-2 text-sm"
              >
                {canManage ? (
                  <form action={updateLeadSourceAction} className="flex flex-1 flex-wrap items-center gap-2">
                    <input type="hidden" name="id" value={source.id} />
                    <Input name="name" defaultValue={source.name} className="h-8 max-w-xs" />
                    <Badge tone="neutral">{source.code}</Badge>
                    <Badge tone={source.isActive ? "success" : "neutral"}>
                      {source.isActive ? "Active" : "Inactive"}
                    </Badge>
                    <Button size="sm" variant="secondary">Save</Button>
                  </form>
                ) : (
                  <span className="flex items-center gap-2">
                    {source.name}
                    <Badge tone="neutral">{source.code}</Badge>
                  </span>
                )}
                {canManage ? (
                  <form action={toggleLeadSourceAction}>
                    <input type="hidden" name="id" value={source.id} />
                    <Button size="sm" variant="ghost">
                      {source.isActive ? "Deactivate" : "Activate"}
                    </Button>
                  </form>
                ) : null}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
