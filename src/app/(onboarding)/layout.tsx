import { redirect } from "next/navigation";
import { isAppConfigured } from "@/lib/config/env";

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
