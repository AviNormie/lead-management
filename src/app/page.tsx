import { redirect } from "next/navigation";
import { isAppConfigured } from "@/lib/config/env";
import { getSessionContext } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  if (!isAppConfigured()) {
    redirect("/setup");
  }

  const session = await getSessionContext();
  if (!session?.userId) {
    redirect("/login");
  }
  if (!session.activeOrganizationId) {
    redirect("/onboarding/organization");
  }
  redirect("/dashboard");
}
