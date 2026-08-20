import type { Prisma } from "@prisma/client";
import type { TenantContext } from "@/lib/tenant";
import { hasPermission } from "@/lib/tenant";

export function leadVisibilityWhere(
  tenant: TenantContext,
): Prisma.LeadWhereInput {
  if (hasPermission(tenant, "lead.view_all")) {
    return { organizationId: tenant.organizationId };
  }
  return {
    organizationId: tenant.organizationId,
    assignedUserId: tenant.userId,
  };
}
