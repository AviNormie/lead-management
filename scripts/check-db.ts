import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env", quiet: true });

const urls = [
  { name: "DATABASE_URL (6543)", value: process.env.DATABASE_URL },
  { name: "DIRECT_URL (5432)", value: process.env.DIRECT_URL },
];

async function check(label: string, connectionString: string | undefined) {
  if (!connectionString?.trim()) {
    console.error(`✗ ${label}: not set`);
    return false;
  }

  if (connectionString.includes("localhost")) {
    console.error(`✗ ${label}: still points to localhost`);
    return false;
  }

  try {
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient({
      datasources: { db: { url: connectionString } },
    });
    await prisma.$queryRaw`SELECT 1 as ok`;
    await prisma.$disconnect();
    console.log(`✓ ${label}: connected`);
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`✗ ${label}: ${message}`);
    return false;
  }
}

async function main() {
  console.log("Checking Supabase Postgres connections...\n");
  let ok = true;
  for (const { name, value } of urls) {
    const passed = await check(name, value);
    ok &&= passed;
  }

  if (!ok) {
    console.log(
      "\nFix: Supabase Dashboard → Connect → copy Transaction (6543) and Session (5432) strings.",
    );
    console.log(
      "If you see password authentication failed, reset the database password in Settings → Database.",
    );
    process.exit(1);
  }

  console.log("\nAll database connections OK.");
}

main();
