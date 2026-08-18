import { redirect } from "next/navigation";
import { getSupabaseAuthUser } from "@/lib/auth/supabase-user";
import { logoutAction } from "@/features/auth/actions";

export const dynamic = "force-dynamic";

export default async function SessionErrorPage() {
  const user = await getSupabaseAuthUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas p-4">
      <div className="ic-panel w-full max-w-lg p-8">
        <div className="mb-6">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-sm font-bold text-white">
            IC
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Could not load your account
          </h1>
          <p className="mt-2 text-sm text-muted">
            You are signed in to Supabase Auth, but the app database is
            unavailable. This usually means{" "}
            <code className="rounded bg-muted px-1">DATABASE_URL</code> on
            Vercel points to localhost or migrations have not been run.
          </p>
        </div>

        <ul className="mb-6 space-y-2 text-sm text-muted">
          <li>Use the Supabase Postgres pooler URL for DATABASE_URL.</li>
          <li>Use the direct Postgres URL for DIRECT_URL.</li>
          <li>Run npx prisma migrate deploy against production.</li>
        </ul>

        <form action={logoutAction}>
          <button
            type="submit"
            className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white"
          >
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
