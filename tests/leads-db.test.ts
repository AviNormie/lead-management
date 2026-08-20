import { afterAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { seedOrganizationLeadDefaults } from "@/lib/leads/seed-defaults";
import { findDuplicateLeads } from "@/lib/leads/duplicates";

const prisma = new PrismaClient();

describe("lead tenant isolation and duplicates (db)", () => {
  const orgIds: string[] = [];

  afterAll(async () => {
    for (const id of orgIds) {
      await prisma.organization.deleteMany({ where: { id } });
    }
    await prisma.$disconnect();
  });

  it("scopes sources to the organization and detects duplicates", async () => {
    const org = await prisma.organization.create({
      data: { name: "Lead Org", slug: `lead-org-${Date.now()}` },
    });
    orgIds.push(org.id);
    await seedOrganizationLeadDefaults(prisma, org.id);

    const stages = await prisma.leadStage.findMany({
      where: { organizationId: org.id },
    });
    expect(stages.map((s) => s.name)).toContain("Negotiation");

    const source = await prisma.leadSource.findFirst({
      where: { organizationId: org.id, code: "manual" },
    });

    await prisma.lead.create({
      data: {
        organizationId: org.id,
        fullName: "Pat Lee",
        email: "pat@example.com",
        phone: "555-0100",
        sourceId: source?.id,
      },
    });

    const dupes = await findDuplicateLeads(org.id, {
      email: "pat@example.com",
    });
    expect(dupes.length).toBe(1);
    expect(dupes[0].matchedOn).toContain("email");

    const otherOrg = await prisma.organization.create({
      data: { name: "Other Org", slug: `other-org-${Date.now()}` },
    });
    orgIds.push(otherOrg.id);
    const otherDupes = await findDuplicateLeads(otherOrg.id, {
      email: "pat@example.com",
    });
    expect(otherDupes.length).toBe(0);
  });
});
