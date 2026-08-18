"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Root error", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas p-4">
      <div className="ic-panel w-full max-w-md p-8 text-center">
        <h1 className="text-xl font-bold tracking-tight">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted">
          Please try again, or go back to sign in.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-white"
          >
            Try again
          </button>
          <Link href="/login" className="text-sm font-medium text-primary">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
