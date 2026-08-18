import { getMissingEnvVars, isAppConfigured } from "@/lib/config/env";
import { ConfigRequired } from "@/components/config-required";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function SetupPage() {
  if (isAppConfigured()) {
    redirect("/login");
  }

  return <ConfigRequired missing={getMissingEnvVars()} />;
}
