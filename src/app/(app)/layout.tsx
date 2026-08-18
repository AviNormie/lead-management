import { redirect } from "next/navigation";
import { getSupabaseAuthUser } from "@/lib/auth/supabase-user";
import { isAppConfigured } from "@/lib/config/env";
import { getSessionContext } from "@/lib/tenant";
import { prisma } from "@/lib/db/prisma";
import { AppShell } from "@/components/layout/app-shell";

export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isAppConfigured()) {
    redirect("/setup");
  }

  const session = await getSessionContext();
  if (!session?.userId) {
    const authUser = await getSupabaseAuthUser();
    if (authUser) {
      redirect("/auth/session-error");
    }
    redirect("/login");
  }
  if (!session.activeOrganizationId) {
    redirect("/onboarding/organization");
  }

  try {
    const organization = await prisma.organization.findUnique({
      where: { id: session.activeOrganizationId },
      select: { name: true, slug: true },
    });
    const membership = await prisma.organizationMember.findUnique({
      where: {
        organizationId_userId: {
          organizationId: session.activeOrganizationId,
          userId: session.userId,
        },
      },
      include: { role: { select: { name: true } } },
    });

    return (
      <AppShell
        userName={session.name ?? session.email ?? "User"}
        roleName={membership?.role.name ?? "Member"}
        organizationName={organization?.name ?? "Organization"}
      >
        {children}
      </AppShell>
    );
  } catch (error) {
    console.error("AppLayout failed", error);
    return (
      <AppShell
        userName={session.name ?? session.email ?? "User"}
        roleName="Member"
        organizationName="Organization"
      >
        {children}
      </AppShell>
    );
  }
}
