import { AppError } from "@/lib/errors";

export function assertSameOrganization(
  resourceOrgId: string,
  contextOrgId: string,
) {
  if (resourceOrgId !== contextOrgId) {
    throw new AppError(
      "FORBIDDEN",
      "Resource belongs to another organization",
      403,
    );
  }
}
