import Link from "next/link";
import { logoutAction } from "@/features/auth/actions";

type Props = {
  missing: string[];
  hasSession?: boolean;
};

export function ConfigRequired({ missing, hasSession = false }: Props) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas p-4">
      <div className="ic-panel w-full max-w-lg p-8">
        <div className="mb-6">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-sm font-bold text-white">
            IC
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Setup required</h1>
          <p className="mt-2 text-sm text-muted">
            IntraCore is missing server configuration. Add these environment
            variables in Vercel (Project Settings → Environment Variables),
            then redeploy.
          </p>
        </div>

        <ul className="mb-6 space-y-2 rounded-xl bg-muted/40 p-4 font-mono text-xs">
          {missing.map((key) => (
            <li key={key}>{key}</li>
          ))}
        </ul>

        <div className="space-y-3 text-sm text-muted">
          <p>
            Use your Supabase project URL and keys. For{" "}
            <code className="rounded bg-muted px-1">DATABASE_URL</code> and{" "}
            <code className="rounded bg-muted px-1">DIRECT_URL</code>, use the
            Supabase Postgres connection strings (not localhost).
          </p>
          <p>
            Set{" "}
            <code className="rounded bg-muted px-1">NEXT_PUBLIC_SITE_URL</code>{" "}
            to your production URL, e.g.{" "}
            <code className="rounded bg-muted px-1">
              https://intracore-ou3h.vercel.app
            </code>
            .
          </p>
          <p>
            In Supabase → Authentication → URL Configuration, add redirect URL:{" "}
            <code className="rounded bg-muted px-1">
              https://intracore-ou3h.vercel.app/auth/callback
            </code>
            .
          </p>
        </div>

        {hasSession ? (
          <form action={logoutAction} className="mt-6">
            <button
              type="submit"
              className="text-sm font-medium text-primary hover:underline"
            >
              Sign out and try again
            </button>
          </form>
        ) : (
          <p className="mt-6 text-sm">
            <Link href="/login" className="font-medium text-primary">
              Back to sign in
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
