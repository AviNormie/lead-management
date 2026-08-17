import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { seedOrganizationRoles } from "@/lib/permissions/seed-org-roles";

const prisma = new PrismaClient();

describe("organization role seeding (db)", () => {
  const ids: string[] = [];

  beforeAll(async () => {
    process.env.DATABASE_URL =
      process.env.DATABASE_URL ??
      "postgresql://intracore:intracore@localhost:5432/intracore?schema=public";
  });

  afterAll(async () => {
    for (const id of ids) {
      await prisma.organization.deleteMany({ where: { id } });
    }
    await prisma.$disconnect();
  });

  it("seeds system roles scoped to the organization", async () => {
    const org = await prisma.organization.create({
      data: {
        name: "Test Org A",
        slug: `test-org-a-${Date.now()}`,
      },
    });
    ids.push(org.id);

    const rolesByCode = await seedOrganizationRoles(prisma, org.id);
    expect(rolesByCode.get("owner")).toBeTruthy();

    const roles = await prisma.role.findMany({
      where: { organizationId: org.id },
    });
    expect(roles.length).toBeGreaterThanOrEqual(10);
    expect(roles.every((r) => r.organizationId === org.id)).toBe(true);

    const owner = await prisma.role.findFirst({
      where: { organizationId: org.id, code: "owner" },
      include: { permissions: true },
    });
    expect(owner?.permissions.length).toBeGreaterThan(10);
  });

  it("does not leak roles across organizations", async () => {
    const orgA = await prisma.organization.create({
      data: { name: "Org A", slug: `leak-a-${Date.now()}` },
    });
    const orgB = await prisma.organization.create({
      data: { name: "Org B", slug: `leak-b-${Date.now()}` },
    });
    ids.push(orgA.id, orgB.id);

    await seedOrganizationRoles(prisma, orgA.id);
    await seedOrganizationRoles(prisma, orgB.id);

    const aRoles = await prisma.role.findMany({
      where: { organizationId: orgA.id },
    });
    const bRoles = await prisma.role.findMany({
      where: { organizationId: orgB.id },
    });

    const aIds = new Set(aRoles.map((r) => r.id));
    expect(bRoles.some((r) => aIds.has(r.id))).toBe(false);
  });
});
