import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/tenant";
import { prisma } from "@/lib/db/prisma";
import { AppShell } from "@/components/layout/app-shell";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSessionContext();
  if (!session?.userId) {
    redirect("/login");
  }
  if (!session.activeOrganizationId) {
    redirect("/onboarding/organization");
  }

  const [organization, membership] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: session.activeOrganizationId },
      select: { name: true, slug: true },
    }),
    prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: session.activeOrganizationId,
          userId: session.userId,
        },
      },
      include: { role: { select: { name: true } } },
    }),
  ]);

  return (
    <AppShell
      userName={session.name ?? session.email ?? "User"}
      roleName={membership?.role.name ?? "Member"}
      organizationName={organization?.name ?? "Organization"}
    >
      {children}
    </AppShell>
  );
}
