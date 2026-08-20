import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function appendQueryParam(url: string, key: string, value: string) {
  if (url.includes(`${key}=`)) return url;
  return url.includes("?") ? `${url}&${key}=${value}` : `${url}?${key}=${value}`;
}

/**
 * Vercel serverless: transaction pooler (DATABASE_URL) with connection_limit=1.
 * Long-lived Node (next dev / next start): session pooler (DIRECT_URL) with a small pool
 * so layout + page + Promise.all do not stall on P2024.
 */
function datasourceUrl() {
  const databaseUrl = process.env.DATABASE_URL;
  const directUrl = process.env.DIRECT_URL;
  const onVercel = process.env.VERCEL === "1";

  if (onVercel) {
    return databaseUrl;
  }
  if (directUrl) {
    return appendQueryParam(directUrl, "connection_limit", "5");
  }
  return databaseUrl;
}

const runtimeUrl = datasourceUrl();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: runtimeUrl ? { db: { url: runtimeUrl } } : undefined,
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  });

globalForPrisma.prisma = prisma;
