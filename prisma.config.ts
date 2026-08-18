import path from "node:path";
import { config as loadEnv } from "dotenv";
import { defineConfig, env } from "prisma/config";

// Prisma CLI skips its own .env loader when this file exists.
loadEnv({ path: path.join(__dirname, ".env"), quiet: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  // Migrations and other Prisma CLI commands use the session/direct URL.
  // Runtime Prisma Client still reads DATABASE_URL from schema.prisma.
  datasource: {
    url: env("DIRECT_URL"),
  },
});
