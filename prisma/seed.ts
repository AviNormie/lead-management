import { PrismaClient } from "@prisma/client";
import { PERMISSIONS } from "../src/lib/permissions/catalog";

const prisma = new PrismaClient();

async function main() {
  for (const permission of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { code: permission.code },
      update: {
        name: permission.name,
        module: permission.module,
        description: permission.description ?? null,
      },
      create: {
        code: permission.code,
        name: permission.name,
        module: permission.module,
        description: permission.description ?? null,
      },
    });
  }

  console.log(`Seeded ${PERMISSIONS.length} permissions.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
