import { redirect } from "next/navigation";
import { getSupabaseAuthUser } from "@/lib/auth/supabase-user";
import { isAppConfigured } from "@/lib/config/env";
import { getSessionContext, requireOrganizationAccess } from "@/lib/tenant";
import { getLeadNavViews } from "@/features/leads/queries";
import { AppShell } from "@/components/layout/app-shell";
import { getUnreadNotificationCount } from "@/lib/email/crm-notify";

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
    const tenant = await requireOrganizationAccess();
    const [leadNavGroups, unreadNotifications] = await Promise.all([
      getLeadNavViews(tenant.organizationId),
      getUnreadNotificationCount(tenant.organizationId, tenant.userId),
    ]);
    return (
      <AppShell
        userName={tenant.userName ?? tenant.userEmail ?? "User"}
        roleName={tenant.roleName}
        organizationName={tenant.organizationName}
        leadNavGroups={leadNavGroups}
        unreadNotifications={unreadNotifications}
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
