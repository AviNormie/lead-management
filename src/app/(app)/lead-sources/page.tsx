import { requirePermission } from "@/lib/tenant";
import { prisma } from "@/lib/db/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function LeadSourcesPage() {
  const tenant = await requirePermission("lead.view");
  const sources = await prisma.leadSource.findMany({
    where: { organizationId: tenant.organizationId },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <PageHeader
        breadcrumbs={["Leads", "Sources"]}
        title="Lead sources"
        subtitle="Configurable per organization. Not hardcoded on the Lead model."
      />
      <Card>
        <CardContent className="pt-5">
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {sources.map((source) => (
              <li
                key={source.id}
                className="flex items-center justify-between rounded-xl bg-[var(--ic-surface-muted)] px-3 py-2 text-sm"
              >
                <span>{source.name}</span>
                <Badge tone="neutral">{source.code}</Badge>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
