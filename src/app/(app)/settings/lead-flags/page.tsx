import { requirePermission } from "@/lib/tenant";
import { prisma } from "@/lib/db/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  createFlagDefinitionAction,
  toggleFlagDefinitionAction,
} from "@/features/leads/custom-field-actions";

export default async function LeadFlagsSettingsPage() {
  const tenant = await requirePermission("lead.manage_flags");
  const flags = await prisma.leadFlagDefinition.findMany({
    where: { organizationId: tenant.organizationId },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div>
      <PageHeader
        breadcrumbs={["Settings", "Lead flags"]}
        title="Lead flags"
        subtitle="Hot, warm, red flag, and other classifications for lead queues"
      />
      <Card className="mb-4">
        <CardContent className="pt-5">
          <form action={createFlagDefinitionAction} className="flex flex-wrap gap-2">
            <Input name="label" placeholder="Flag label" required className="max-w-xs" />
            <Input name="key" placeholder="Key (optional)" className="max-w-[140px]" />
            <Input name="color" placeholder="#EF4444" className="max-w-[120px]" />
            <Button type="submit" size="sm">Add flag</Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-5">
          <ul className="grid gap-2">
            {flags.map((flag) => (
              <li
                key={flag.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[var(--ic-surface-muted)] px-3 py-2 text-sm"
              >
                <span className="flex items-center gap-2">
                  {flag.color ? (
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ background: flag.color }}
                    />
                  ) : null}
                  {flag.label}
                  <Badge tone="neutral">{flag.key}</Badge>
                </span>
                <form action={toggleFlagDefinitionAction}>
                  <input type="hidden" name="id" value={flag.id} />
                  <Button size="sm" variant="ghost">
                    {flag.isActive ? "Deactivate" : "Activate"}
                  </Button>
                </form>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
