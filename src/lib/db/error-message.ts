export function getDatabaseErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);

  if (
    message.includes("Authentication failed") ||
    message.includes("password authentication failed") ||
    message.includes("P1000")
  ) {
    return "Database password is wrong. In Supabase → Settings → Database, reset the password and update DATABASE_URL and DIRECT_URL in Vercel.";
  }

  if (message.includes("P1001") || message.includes("Can't reach database")) {
    return "Cannot reach Postgres. Use the Supabase pooler URLs from Settings → Database, not localhost.";
  }

  if (message.includes("does not exist") || message.includes("P2021")) {
    return "Database tables are missing. Run: npx prisma migrate deploy";
  }

  return "App database is unavailable. Check DATABASE_URL and DIRECT_URL in Vercel, then redeploy.";
}
