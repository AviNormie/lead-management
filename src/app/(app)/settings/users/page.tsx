import { prisma } from "@/lib/db/prisma";
import { hasPermission, requirePermission } from "@/lib/tenant";
import { InviteMemberForm } from "@/features/members/invite-member-form";
import { PageHeader } from "@/components/layout/page-header";
import { DataTable } from "@/components/layout/data-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";

export default async function UsersSettingsPage() {
  const tenant = await requirePermission("member.view");
  const canInvite = hasPermission(tenant, "member.invite");

  const [members, roles, invitations] = await Promise.all([
    prisma.organizationMember.findMany({
      where: { organizationId: tenant.organizationId },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
        role: { select: { name: true, code: true } },
      },
      orderBy: { joinedAt: "asc" },
    }),
    prisma.role.findMany({
      where: { organizationId: tenant.organizationId },
      orderBy: { name: "asc" },
      select: { id: true, name: true, code: true },
    }),
    prisma.invitation.findMany({
      where: {
        organizationId: tenant.organizationId,
        status: "PENDING",
      },
      include: { role: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div>
      <PageHeader
        breadcrumbs={["Settings", "Users"]}
        title="Users"
        subtitle="Members of the current organization"
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Members</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={["User", "Email", "Role", "Owner", "Status"]}>
            {members.map((member) => (
              <tr
                key={member.id}
                className="border-b border-[var(--ic-border)] last:border-0"
              >
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2.5">
                    <Avatar
                      name={member.user.name}
                      src={member.user.image}
                      size="sm"
                    />
                    <span className="font-medium">
                      {member.user.name ?? "—"}
                    </span>
                  </div>
                </td>
                <td className="px-3 py-3 text-muted">{member.user.email}</td>
                <td className="px-3 py-3">
                  <Badge tone="neutral">{member.role.name}</Badge>
                </td>
                <td className="px-3 py-3">
                  {member.isOwner ? (
                    <Badge tone="primary">Owner</Badge>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-3 py-3">
                  <Badge
                    tone={member.status === "ACTIVE" ? "success" : "warning"}
                  >
                    {member.status}
                  </Badge>
                </td>
              </tr>
            ))}
          </DataTable>
        </CardContent>
      </Card>

      {invitations.length > 0 ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Pending invitations</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              {invitations.map((inv) => (
                <li
                  key={inv.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[var(--ic-surface-muted)] px-3 py-2"
                >
                  <span>
                    {inv.email} — {inv.role.name}
                  </span>
                  <span className="text-2xs text-subtle">
                    Expires {inv.expiresAt.toISOString().slice(0, 10)}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      {canInvite ? <InviteMemberForm roles={roles} /> : null}
    </div>
  );
}
