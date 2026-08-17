import { prisma } from "@/lib/db/prisma";
import { requirePermission } from "@/lib/tenant";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function RolesSettingsPage() {
  const tenant = await requirePermission("role.view");

  const roles = await prisma.role.findMany({
    where: { organizationId: tenant.organizationId },
    include: {
      permissions: { include: { permission: true } },
      _count: { select: { members: true } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <PageHeader
        breadcrumbs={["Settings", "Roles"]}
        title="Roles"
        subtitle="System roles seeded for this organization"
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {roles.map((role) => (
          <Card key={role.id}>
            <CardHeader>
              <div>
                <CardTitle className="flex flex-wrap items-center gap-2">
                  {role.name}
                  {role.isSystem ? <Badge tone="primary">System</Badge> : null}
                </CardTitle>
                <p className="mt-1 text-2xs text-subtle">{role.code}</p>
              </div>
              <Badge tone="neutral">{role._count.members} members</Badge>
            </CardHeader>
            <CardContent>
              <p className="mb-2 text-2xs font-semibold uppercase tracking-wide text-subtle">
                Permissions
              </p>
              <div className="flex flex-wrap gap-1.5">
                {role.permissions.slice(0, 12).map((rp) => (
                  <Badge key={rp.permissionId} tone="neutral">
                    {rp.permission.code}
                  </Badge>
                ))}
                {role.permissions.length > 12 ? (
                  <Badge tone="default">
                    +{role.permissions.length - 12} more
                  </Badge>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
