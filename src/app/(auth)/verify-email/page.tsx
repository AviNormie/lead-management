import Link from "next/link";

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas p-4">
      <div className="ic-panel w-full max-w-md p-8 text-center">
        <h1 className="mb-2 text-2xl font-bold tracking-tight">
          Check your email
        </h1>
        <p className="mb-6 text-sm text-muted">
          Confirm your address using the link we sent. After verification you
          can sign in and create your organization.
        </p>
        <Link href="/login" className="text-sm font-medium text-primary">
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
