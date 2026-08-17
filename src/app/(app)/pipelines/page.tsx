import { requirePermission } from "@/lib/tenant";
import { prisma } from "@/lib/db/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function PipelinesPage() {
  const tenant = await requirePermission("lead.view");
  const pipelines = await prisma.pipeline.findMany({
    where: { organizationId: tenant.organizationId },
    include: { stages: { orderBy: { sortOrder: "asc" } } },
  });

  return (
    <div>
      <PageHeader
        breadcrumbs={["Leads", "Pipelines"]}
        title="Pipelines"
        subtitle="Stages are organization-specific and seeded on workspace create."
      />
      <div className="grid gap-4">
        {pipelines.map((pipeline) => (
          <Card key={pipeline.id}>
            <CardHeader>
              <CardTitle>
                {pipeline.name}{" "}
                {pipeline.isDefault ? <Badge tone="primary">Default</Badge> : null}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="flex flex-wrap gap-2">
                {pipeline.stages.map((stage) => (
                  <li
                    key={stage.id}
                    className="rounded-pill px-3 py-1 text-sm text-white"
                    style={{ background: stage.color ?? "#2a2f3a" }}
                  >
                    {stage.name} ({stage.probability}%)
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
