import { redirect } from "next/navigation";
import { getSessionContext } from "@/lib/tenant";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await getSessionContext();
  if (!session?.userId) {
    redirect("/login");
  }
  if (!session.activeOrganizationId) {
    redirect("/onboarding/organization");
  }
  redirect("/dashboard");
}
