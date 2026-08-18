import { config as loadEnv } from "dotenv";
import net from "node:net";
import { URL } from "node:url";

loadEnv({ path: ".env", quiet: true });

type Target = {
  name: string;
  envName: "DATABASE_URL" | "DIRECT_URL";
};

const targets: Target[] = [
  { name: "DATABASE_URL (transaction pooler)", envName: "DATABASE_URL" },
  { name: "DIRECT_URL (session/direct)", envName: "DIRECT_URL" },
];

function redact(raw: string): string {
  try {
    const url = new URL(raw);
    const user = url.username.includes(".")
      ? `${url.username.split(".")[0]}.[project-ref]`
      : url.username || "(none)";
    return `${url.protocol}//${user}@${url.hostname}:${url.port}${url.pathname}${url.search}`;
  } catch {
    return "(unparseable URL)";
  }
}

function parse(raw: string) {
  const url = new URL(raw);
  return {
    host: url.hostname,
    port: Number(url.port || 5432),
    sslmode: url.searchParams.get("sslmode") ?? "(not set)",
    pgbouncer: url.searchParams.get("pgbouncer") ?? "(not set)",
    redacted: redact(raw),
  };
}

function tcpCheck(host: string, port: number, timeoutMs = 8000): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = net.connect({ host, port });
    const done = (ok: boolean) => {
      socket.destroy();
      resolve(ok);
    };
    socket.setTimeout(timeoutMs);
    socket.once("connect", () => done(true));
    socket.once("timeout", () => done(false));
    socket.once("error", () => done(false));
  });
}

async function check(target: Target) {
  const raw = process.env[target.envName];
  console.log(`=== ${target.name} ===`);
  if (!raw?.trim()) {
    console.error("status: MISSING");
    return false;
  }
  if (raw.includes("localhost") || raw.includes("127.0.0.1")) {
    console.error("status: points at localhost — use Supabase pooler URLs");
    return false;
  }

  let parsed;
  try {
    parsed = parse(raw);
  } catch {
    console.error("status: invalid URL");
    return false;
  }

  console.log(`endpoint: ${parsed.host}:${parsed.port}`);
  console.log(`sslmode: ${parsed.sslmode}`);
  console.log(`pgbouncer: ${parsed.pgbouncer}`);

  const reachable = await tcpCheck(parsed.host, parsed.port);
  console.log(`tcp: ${reachable ? "reachable" : "UNREACHABLE"}`);

  try {
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient({
      datasources: { db: { url: raw } },
    });
    await prisma.$queryRaw`SELECT 1 as ok`;
    await prisma.$disconnect();
    console.log("prisma: connected\n");
    return true;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const authFailed =
      message.includes("P1000") ||
      message.toLowerCase().includes("authentication failed") ||
      message.toLowerCase().includes("password");
    const unreachable = message.includes("P1001") || message.includes("Can't reach");
    if (authFailed) {
      console.error(
        "prisma: authentication failed (wrong database password in this URL)",
      );
    } else if (unreachable && reachable) {
      console.error(
        "prisma: P1001 while TCP is open — usually a wrong database password (Prisma reports this as unreachable)",
      );
    } else {
      console.error(`prisma: ${message.replace(/postgresql:\/\/[^@\s]+@/g, "postgresql://[redacted]@")}`);
    }
    console.log("");
    return false;
  }
}

async function main() {
  let ok = true;
  for (const target of targets) {
    ok = (await check(target)) && ok;
  }
  if (!ok) {
    process.exit(1);
  }
}

main();
