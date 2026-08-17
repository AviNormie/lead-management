import { prisma } from "@/lib/db/prisma";
import { seedOrganizationLeadDefaults } from "@/lib/leads/seed-defaults";
import type { Prisma } from "@prisma/client";
import { leadListQuerySchema } from "@/lib/validations/leads";

export async function listLeads(
  organizationId: string,
  raw: Record<string, string | string[] | undefined>,
) {
  const parsed = leadListQuerySchema.parse({
    q: typeof raw.q === "string" ? raw.q : undefined,
    status: typeof raw.status === "string" && raw.status ? raw.status : undefined,
    stageId: typeof raw.stageId === "string" && raw.stageId ? raw.stageId : undefined,
    sourceId:
      typeof raw.sourceId === "string" && raw.sourceId ? raw.sourceId : undefined,
    assignedUserId:
      typeof raw.assignedUserId === "string" && raw.assignedUserId
        ? raw.assignedUserId
        : undefined,
    page: raw.page,
    pageSize: raw.pageSize,
    sort: raw.sort,
    dir: raw.dir,
  });

  const where: Prisma.LeadWhereInput = {
    organizationId,
    archivedAt: null,
  };

  if (parsed.status) where.status = parsed.status;
  if (parsed.stageId) where.stageId = parsed.stageId;
  if (parsed.sourceId) where.sourceId = parsed.sourceId;
  if (parsed.assignedUserId) where.assignedUserId = parsed.assignedUserId;
  if (parsed.q) {
    where.OR = [
      { fullName: { contains: parsed.q, mode: "insensitive" } },
      { company: { contains: parsed.q, mode: "insensitive" } },
      { email: { contains: parsed.q, mode: "insensitive" } },
      { phone: { contains: parsed.q, mode: "insensitive" } },
    ];
  }

  const skip = (parsed.page - 1) * parsed.pageSize;

  const [total, rows] = await Promise.all([
    prisma.lead.count({ where }),
    prisma.lead.findMany({
      where,
      include: {
        source: true,
        stage: true,
        assignedUser: { select: { id: true, name: true, email: true } },
      },
      orderBy: { [parsed.sort]: parsed.dir },
      skip,
      take: parsed.pageSize,
    }),
  ]);

  return { total, rows, page: parsed.page, pageSize: parsed.pageSize };
}

export async function getLeadLookups(organizationId: string) {
  let [sources, pipelines] = await Promise.all([
    prisma.leadSource.findMany({
      where: { organizationId, isActive: true },
      orderBy: { name: "asc" },
    }),
    prisma.pipeline.findMany({
      where: { organizationId },
      include: { stages: { orderBy: { sortOrder: "asc" } } },
      orderBy: { name: "asc" },
    }),
  ]);
  const members = await prisma.organizationMember.findMany({
    where: { organizationId, status: "ACTIVE" },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  if (sources.length === 0 || pipelines.length === 0) {
    await seedOrganizationLeadDefaults(prisma, organizationId);
    [sources, pipelines] = await Promise.all([
      prisma.leadSource.findMany({
        where: { organizationId, isActive: true },
        orderBy: { name: "asc" },
      }),
      prisma.pipeline.findMany({
        where: { organizationId },
        include: { stages: { orderBy: { sortOrder: "asc" } } },
        orderBy: { name: "asc" },
      }),
    ]);
  }

  const stages = pipelines.flatMap((p) => p.stages);
  return { sources, pipelines, stages, members };
}

export async function getLeadDashboardStats(
  organizationId: string,
  userId: string,
) {
  const now = new Date();
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date(now);
  endOfToday.setHours(23, 59, 59, 999);

  const base = { organizationId, archivedAt: null };

  const [
    total,
    newLeads,
    assignedToMe,
    contacted,
    qualified,
    converted,
    lost,
    followUpsDue,
    overdueFollowUps,
    pipelineAgg,
  ] = await Promise.all([
    prisma.lead.count({ where: base }),
    prisma.lead.count({ where: { ...base, status: "NEW" } }),
    prisma.lead.count({ where: { ...base, assignedUserId: userId } }),
    prisma.lead.count({
      where: { ...base, status: { in: ["OPEN", "IN_PROGRESS"] } },
    }),
    prisma.lead.count({ where: { ...base, status: "QUALIFIED" } }),
    prisma.lead.count({ where: { ...base, status: "CONVERTED" } }),
    prisma.lead.count({ where: { ...base, status: "LOST" } }),
    prisma.leadFollowUp.count({
      where: {
        organizationId,
        status: "PENDING",
        dueAt: { gte: startOfToday, lte: endOfToday },
      },
    }),
    prisma.leadFollowUp.count({
      where: {
        organizationId,
        status: "PENDING",
        dueAt: { lt: startOfToday },
      },
    }),
    prisma.lead.aggregate({
      where: { ...base, status: { notIn: ["LOST", "CONVERTED"] } },
      _sum: { expectedValue: true },
    }),
  ]);

  const conversionRate =
    total > 0 ? Math.round((converted / total) * 1000) / 10 : 0;

  return {
    total,
    newLeads,
    assignedToMe,
    contacted,
    qualified,
    converted,
    lost,
    followUpsDue,
    overdueFollowUps,
    conversionRate,
    pipelineValue: Number(pipelineAgg._sum.expectedValue ?? 0),
  };
}
