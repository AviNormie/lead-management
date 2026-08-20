import { describe, expect, it } from "vitest";
import { computeFullName } from "@/lib/validations/leads";
import { readFileSync } from "fs";
import path from "path";

describe("computeFullName", () => {
  it("joins first and last name", () => {
    expect(computeFullName({ firstName: "Ada", lastName: "Lovelace" })).toBe(
      "Ada Lovelace",
    );
  });

  it("falls back to company then email", () => {
    expect(computeFullName({ company: "Acme" })).toBe("Acme");
    expect(computeFullName({ email: "a@b.com" })).toBe("a@b.com");
  });
});

describe("lead visibility", () => {
  it("limits assigned-only users without lead.view_all", async () => {
    const { leadVisibilityWhere } = await import("@/features/leads/scope");
    const tenant = {
      userId: "user-1",
      organizationId: "org-1",
      membershipId: "m-1",
      roleId: "r-1",
      isOwner: false,
      permissions: new Set(["lead.view"]),
      roleName: "Member",
      organizationName: "Org",
      organizationCurrency: "USD",
      userName: null,
      userEmail: null,
    };
    expect(leadVisibilityWhere(tenant)).toEqual({
      organizationId: "org-1",
      assignedUserId: "user-1",
    });
  });

  it("owners and view_all see the whole organization", async () => {
    const { leadVisibilityWhere } = await import("@/features/leads/scope");
    const tenant = {
      userId: "user-1",
      organizationId: "org-1",
      membershipId: "m-1",
      roleId: "r-1",
      isOwner: true,
      permissions: new Set<string>(),
      roleName: "Owner",
      organizationName: "Org",
      organizationCurrency: "USD",
      userName: null,
      userEmail: null,
    };
    expect(leadVisibilityWhere(tenant)).toEqual({
      organizationId: "org-1",
    });
  });
});

describe("supabase key isolation", () => {
  it("does not use the service role key in the browser client", () => {
    const client = readFileSync(
      path.join(process.cwd(), "src/lib/supabase/client.ts"),
      "utf8",
    );
    expect(client).not.toContain("SUPABASE_SERVICE_ROLE_KEY");
    expect(client).toContain("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  });

  it("keeps the service role key in admin.ts only", () => {
    const admin = readFileSync(
      path.join(process.cwd(), "src/lib/supabase/admin.ts"),
      "utf8",
    );
    expect(admin).toContain("SUPABASE_SERVICE_ROLE_KEY");
  });
});
