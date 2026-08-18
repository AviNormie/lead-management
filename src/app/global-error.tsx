"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-white p-6 font-sans">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-bold">Something went wrong</h1>
          <p className="mt-2 text-sm text-gray-600">
            IntraCore hit an unexpected error. You can retry or return to sign in.
          </p>
          <div className="mt-6 flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={reset}
              className="rounded-xl bg-[#2f6bff] px-4 py-2 text-sm font-medium text-white"
            >
              Try again
            </button>
            <Link href="/login" className="text-sm font-medium text-[#2f6bff]">
              Sign in
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
