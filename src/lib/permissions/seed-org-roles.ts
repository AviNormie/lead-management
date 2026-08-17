import type { Prisma, PrismaClient } from "@prisma/client";
import {
  PERMISSIONS,
  SYSTEM_ROLE_TEMPLATES,
} from "@/lib/permissions/catalog";

type DbClient = PrismaClient | Prisma.TransactionClient;

/** Ensure global permission catalog exists (idempotent). */
export async function ensurePermissionsSeeded(db: DbClient) {
  for (const permission of PERMISSIONS) {
    await db.permission.upsert({
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
}

/**
 * Clone system role templates into an organization and attach permissions.
 * Call inside the same transaction that creates the organization.
 */
export async function seedOrganizationRoles(
  db: DbClient,
  organizationId: string,
) {
  await ensurePermissionsSeeded(db);

  const allPermissions = await db.permission.findMany();
  const byCode = new Map(allPermissions.map((p) => [p.code, p]));

  const rolesByCode = new Map<string, string>();

  for (const template of SYSTEM_ROLE_TEMPLATES) {
    const role = await db.role.create({
      data: {
        organizationId,
        code: template.code,
        name: template.name,
        description: template.description,
        isSystem: true,
      },
    });
    rolesByCode.set(template.code, role.id);

    const permissionCodes =
      template.permissions === "*"
        ? allPermissions.map((p) => p.code)
        : template.permissions;

    const links = permissionCodes
      .map((code) => byCode.get(code))
      .filter((p): p is (typeof allPermissions)[number] => Boolean(p))
      .map((permission) => ({
        roleId: role.id,
        permissionId: permission.id,
      }));

    if (links.length > 0) {
      await db.rolePermission.createMany({
        data: links,
        skipDuplicates: true,
      });
    }
  }

  return rolesByCode;
}
