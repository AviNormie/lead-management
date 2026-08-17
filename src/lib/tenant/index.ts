import { MemberStatus } from "@prisma/client";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { AppError } from "@/lib/errors";
import { ensurePrismaUser } from "@/lib/auth/ensure-user";

export { assertSameOrganization } from "@/lib/tenant/assert";

export type SessionContext = {
  userId: string;
  email: string | null | undefined;
  name: string | null | undefined;
  activeOrganizationId: string | null;
  membershipId: string | null;
};

export type TenantContext = {
  userId: string;
  organizationId: string;
  membershipId: string;
  roleId: string;
  isOwner: boolean;
  permissions: Set<string>;
};

export async function getSessionContext(): Promise<SessionContext | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null;
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return null;
  }

  const dbUser = await ensurePrismaUser(user);
  const membership = dbUser.activeOrganizationId
    ? await prisma.organizationMember.findUnique({
        where: {
          organizationId_userId: {
            organizationId: dbUser.activeOrganizationId,
            userId: dbUser.id,
          },
        },
      })
    : await prisma.organizationMember.findFirst({
        where: { userId: dbUser.id, status: MemberStatus.ACTIVE },
        orderBy: { joinedAt: "asc" },
      });

  if (
    membership &&
    dbUser.activeOrganizationId !== membership.organizationId
  ) {
    await prisma.user.update({
      where: { id: dbUser.id },
      data: { activeOrganizationId: membership.organizationId },
    });
  }

  return {
    userId: dbUser.id,
    email: dbUser.email,
    name: dbUser.name,
    activeOrganizationId: membership?.organizationId ?? null,
    membershipId: membership?.id ?? null,
  };
}

export async function requireAuth(): Promise<SessionContext> {
  const ctx = await getSessionContext();
  if (!ctx) {
    throw new AppError("UNAUTHORIZED", "Authentication required", 401);
  }
  return ctx;
}

export async function requireOrganizationAccess(
  organizationId?: string,
): Promise<TenantContext> {
  const session = await requireAuth();
  const orgId = organizationId ?? session.activeOrganizationId;

  if (!orgId) {
    throw new AppError(
      "NO_ORGANIZATION",
      "No active organization. Create or join an organization first.",
      403,
    );
  }

  const membership = await prisma.organizationMember.findUnique({
    where: {
      organizationId_userId: {
        organizationId: orgId,
        userId: session.userId,
      },
    },
    include: {
      role: {
        include: {
          permissions: {
            include: { permission: true },
          },
        },
      },
    },
  });

  if (!membership || membership.status !== MemberStatus.ACTIVE) {
    throw new AppError(
      "FORBIDDEN",
      "You do not have access to this organization",
      403,
    );
  }

  const permissions = new Set(
    membership.role.permissions.map((rp) => rp.permission.code),
  );

  return {
    userId: session.userId,
    organizationId: membership.organizationId,
    membershipId: membership.id,
    roleId: membership.roleId,
    isOwner: membership.isOwner,
    permissions,
  };
}

export async function getCurrentOrganization() {
  const tenant = await requireOrganizationAccess();
  const organization = await prisma.organization.findFirst({
    where: { id: tenant.organizationId },
  });
  if (!organization) {
    throw new AppError("NOT_FOUND", "Organization not found", 404);
  }
  return { organization, tenant };
}

export async function requirePermission(
  permissionCode: string,
): Promise<TenantContext> {
  const tenant = await requireOrganizationAccess();
  if (!tenant.permissions.has(permissionCode)) {
    throw new AppError(
      "FORBIDDEN",
      `Missing permission: ${permissionCode}`,
      403,
    );
  }
  return tenant;
}

export function hasPermission(
  tenant: TenantContext,
  permissionCode: string,
): boolean {
  return tenant.permissions.has(permissionCode);
}
