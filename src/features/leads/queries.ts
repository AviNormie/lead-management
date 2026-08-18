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

export const EMPTY_DASHBOARD_STATS = {
  total: 0,
  newLeads: 0,
  assignedToMe: 0,
  contacted: 0,
  qualified: 0,
  converted: 0,
  lost: 0,
  followUpsDue: 0,
  overdueFollowUps: 0,
  conversionRate: 0,
  pipelineValue: 0,
};

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

  // Sequential queries: Vercel + PgBouncer often uses connection_limit=1.
  const grouped = await prisma.lead.groupBy({
    by: ["status"],
    where: base,
    _count: { _all: true },
    _sum: { expectedValue: true },
  });

  const countByStatus = Object.fromEntries(
    grouped.map((row) => [row.status, row._count._all]),
  ) as Record<string, number>;

  const total = grouped.reduce((sum, row) => sum + row._count._all, 0);
  const converted = countByStatus.CONVERTED ?? 0;
  const pipelineValue = grouped
    .filter((row) => row.status !== "LOST" && row.status !== "CONVERTED")
    .reduce((sum, row) => sum + Number(row._sum.expectedValue ?? 0), 0);

  const assignedToMe = await prisma.lead.count({
    where: { ...base, assignedUserId: userId },
  });
  const followUpsDue = await prisma.leadFollowUp.count({
    where: {
      organizationId,
      status: "PENDING",
      dueAt: { gte: startOfToday, lte: endOfToday },
    },
  });
  const overdueFollowUps = await prisma.leadFollowUp.count({
    where: {
      organizationId,
      status: "PENDING",
      dueAt: { lt: startOfToday },
    },
  });

  const conversionRate =
    total > 0 ? Math.round((converted / total) * 1000) / 10 : 0;

  return {
    total,
    newLeads: countByStatus.NEW ?? 0,
    assignedToMe,
    contacted: (countByStatus.OPEN ?? 0) + (countByStatus.IN_PROGRESS ?? 0),
    qualified: countByStatus.QUALIFIED ?? 0,
    converted,
    lost: countByStatus.LOST ?? 0,
    followUpsDue,
    overdueFollowUps,
    conversionRate,
    pipelineValue,
  };
}
