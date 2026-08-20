import { hasPermission, requirePermission } from "@/lib/tenant";
import { prisma } from "@/lib/db/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  addPipelineStageAction,
  createPipelineAction,
  togglePipelineAction,
  updatePipelineAction,
  updatePipelineStageAction,
} from "@/features/leads/settings-actions";

export default async function SettingsPipelinesPage() {
  const tenant = await requirePermission("lead.view");
  const canManage = hasPermission(tenant, "lead.manage_pipeline");
  const pipelines = await prisma.pipeline.findMany({
    where: { organizationId: tenant.organizationId },
    include: { stages: { orderBy: { sortOrder: "asc" } } },
  });

  return (
    <div>
      <PageHeader
        breadcrumbs={["Settings", "Pipelines"]}
        title="Pipelines"
        subtitle="Rename stages, set probability, and mark won or lost."
      />
      {canManage ? (
        <Card className="mb-4">
          <CardContent className="pt-5">
            <form action={createPipelineAction} className="flex flex-wrap gap-2">
              <Input name="name" placeholder="Pipeline name" required className="max-w-xs" />
              <Button type="submit" size="sm">Add pipeline</Button>
            </form>
          </CardContent>
        </Card>
      ) : null}
      <div className="grid gap-4">
        {pipelines.map((pipeline) => (
          <Card key={pipeline.id}>
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center gap-2">
                {pipeline.name}
                {pipeline.isDefault ? <Badge tone="primary">Default</Badge> : null}
                <Badge tone={pipeline.isActive ? "success" : "neutral"}>
                  {pipeline.isActive ? "Active" : "Inactive"}
                </Badge>
              </CardTitle>
              {canManage ? (
                <div className="flex gap-2">
                  <form action={updatePipelineAction} className="flex gap-2">
                    <input type="hidden" name="id" value={pipeline.id} />
                    <Input name="name" defaultValue={pipeline.name} className="h-8 w-48" />
                    <Button size="sm" variant="secondary" name="isDefault" value="true">
                      Make default
                    </Button>
                    <Button size="sm" variant="secondary">Save</Button>
                  </form>
                  <form action={togglePipelineAction}>
                    <input type="hidden" name="id" value={pipeline.id} />
                    <Button size="sm" variant="ghost">
                      {pipeline.isActive ? "Deactivate" : "Activate"}
                    </Button>
                  </form>
                </div>
              ) : null}
            </CardHeader>
            <CardContent className="space-y-3">
              {pipeline.stages.map((stage) =>
                canManage ? (
                  <form
                    key={stage.id}
                    action={updatePipelineStageAction}
                    className="flex flex-wrap items-end gap-2 rounded-xl bg-[var(--ic-surface-muted)] p-2"
                  >
                    <input type="hidden" name="id" value={stage.id} />
                    <Input name="name" defaultValue={stage.name} className="h-8 w-40" />
                    <Input
                      name="sortOrder"
                      type="number"
                      defaultValue={stage.sortOrder}
                      className="h-8 w-20"
                    />
                    <Input
                      name="probability"
                      type="number"
                      defaultValue={stage.probability}
                      className="h-8 w-24"
                    />
                    <label className="text-2xs">
                      <input type="checkbox" name="isWon" value="true" defaultChecked={stage.isWon} /> Won
                    </label>
                    <label className="text-2xs">
                      <input type="checkbox" name="isLost" value="true" defaultChecked={stage.isLost} /> Lost
                    </label>
                    <Button size="sm" variant="secondary">Save stage</Button>
                  </form>
                ) : (
                  <span
                    key={stage.id}
                    className="mr-2 inline-flex rounded-pill px-3 py-1 text-sm text-white"
                    style={{ background: stage.color ?? "#2a2f3a" }}
                  >
                    {stage.name} ({stage.probability}%)
                  </span>
                ),
              )}
              {canManage ? (
                <form action={addPipelineStageAction} className="flex flex-wrap gap-2">
                  <input type="hidden" name="pipelineId" value={pipeline.id} />
                  <Input name="name" placeholder="New stage" required className="h-8 max-w-xs" />
                  <Input name="probability" type="number" placeholder="%" className="h-8 w-20" />
                  <Button size="sm">Add stage</Button>
                </form>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
