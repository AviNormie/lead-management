import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import type { TenantContext } from "@/lib/tenant";
import { inquiryListQuerySchema } from "@/lib/validations/inquiries";

export function parseInquiryListQuery(
  raw: Record<string, string | string[] | undefined>,
) {
  return inquiryListQuerySchema.parse({
    q: typeof raw.q === "string" ? raw.q : undefined,
    status:
      typeof raw.status === "string" && raw.status ? raw.status : undefined,
    priority:
      typeof raw.priority === "string" && raw.priority ? raw.priority : undefined,
    assignedUserId:
      typeof raw.assignedUserId === "string" && raw.assignedUserId
        ? raw.assignedUserId
        : undefined,
    page: raw.page,
    pageSize: raw.pageSize,
    sort: raw.sort,
    dir: raw.dir,
  });
}

function inquiryListWhere(
  tenant: TenantContext,
  parsed: ReturnType<typeof parseInquiryListQuery>,
): Prisma.InquiryWhereInput {
  const where: Prisma.InquiryWhereInput = {
    organizationId: tenant.organizationId,
  };

  if (parsed.status) where.status = parsed.status;
  if (parsed.priority) where.priority = parsed.priority;
  if (parsed.assignedUserId) where.assignedUserId = parsed.assignedUserId;
  if (parsed.q) {
    where.OR = [
      { subject: { contains: parsed.q, mode: "insensitive" } },
      { contactName: { contains: parsed.q, mode: "insensitive" } },
      { email: { contains: parsed.q, mode: "insensitive" } },
      { phone: { contains: parsed.q, mode: "insensitive" } },
      { source: { contains: parsed.q, mode: "insensitive" } },
    ];
  }
  return where;
}

const inquiryListInclude = {
  assignedUser: { select: { id: true, name: true, email: true } },
  linkedLead: { select: { id: true, fullName: true } },
} satisfies Prisma.InquiryInclude;

export async function listInquiries(
  tenant: TenantContext,
  raw: Record<string, string | string[] | undefined>,
) {
  const parsed = parseInquiryListQuery(raw);
  const where = inquiryListWhere(tenant, parsed);
  const orderBy: Prisma.InquiryOrderByWithRelationInput = {
    [parsed.sort]: parsed.dir,
  };

  const [rows, total] = await Promise.all([
    prisma.inquiry.findMany({
      where,
      include: inquiryListInclude,
      orderBy,
      skip: (parsed.page - 1) * parsed.pageSize,
      take: parsed.pageSize,
    }),
    prisma.inquiry.count({ where }),
  ]);

  return { rows, total, parsed };
}

export async function getInquiryById(tenant: TenantContext, id: string) {
  return prisma.inquiry.findFirst({
    where: { id, organizationId: tenant.organizationId },
    include: {
      assignedUser: { select: { id: true, name: true, email: true } },
      linkedLead: { select: { id: true, fullName: true } },
    },
  });
}

export async function getInquiryLookups(organizationId: string) {
  const members = await prisma.organizationMember.findMany({
    where: { organizationId, status: "ACTIVE" },
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { joinedAt: "asc" },
  });

  const recentLeads = await prisma.lead.findMany({
    where: { organizationId, archivedAt: null },
    select: { id: true, fullName: true, email: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return {
    members,
    recentLeads,
  };
}
