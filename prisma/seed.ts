import { PrismaClient } from "@prisma/client";
import { ensurePermissionsSeeded } from "../src/lib/permissions/seed-org-roles";

const prisma = new PrismaClient();

async function main() {
  await ensurePermissionsSeeded(prisma);
  console.log("Seeded global permission catalog.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
