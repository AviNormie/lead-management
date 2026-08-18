import { redirect } from "next/navigation";
import { isAppConfigured } from "@/lib/config/env";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isAppConfigured()) {
    redirect("/setup");
  }

  return children;
}
