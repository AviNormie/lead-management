import { getMissingEnvVars, hasSupabasePublicEnv } from "@/lib/config/env";
import { ConfigRequired } from "@/components/config-required";

export const dynamic = "force-dynamic";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!hasSupabasePublicEnv()) {
    return <ConfigRequired missing={getMissingEnvVars()} />;
  }

  return children;
}
