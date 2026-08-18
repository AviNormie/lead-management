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
            You are signed in to Supabase Auth, but Postgres rejected the
            connection. The database password in DATABASE_URL / DIRECT_URL is
            usually wrong, or migrations have not been run.
          </p>
        </div>

        <ol className="mb-6 list-decimal space-y-2 pl-5 text-sm text-muted">
          <li>
            Supabase → <strong>Settings → Database</strong> → reset or copy the
            database password.
          </li>
          <li>
            Copy <strong>Transaction pooler</strong> URL into{" "}
            <code className="rounded bg-muted px-1">DATABASE_URL</code> (port
            6543, with <code className="rounded bg-muted px-1">pgbouncer=true</code>
            ).
          </li>
          <li>
            Copy <strong>Session pooler</strong> URL into{" "}
            <code className="rounded bg-muted px-1">DIRECT_URL</code> (port
            5432).
          </li>
          <li>Paste both into Vercel env vars and redeploy.</li>
          <li>
            Run locally:{" "}
            <code className="rounded bg-muted px-1">npx prisma migrate deploy</code>
          </li>
        </ol>

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
