import { describe, expect, it } from "vitest";
import {
  PERMISSIONS,
  SYSTEM_ROLE_TEMPLATES,
} from "@/lib/permissions/catalog";
import { slugify } from "@/lib/validations/auth";
import { assertSameOrganization } from "@/lib/tenant/assert";
import { AppError } from "@/lib/errors";

describe("permission catalog", () => {
  it("has unique permission codes", () => {
    const codes = PERMISSIONS.map((p) => p.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("includes core org and member permissions", () => {
    const codes = new Set(PERMISSIONS.map((p) => p.code));
    expect(codes.has("org.view")).toBe(true);
    expect(codes.has("member.invite")).toBe(true);
    expect(codes.has("dashboard.view")).toBe(true);
    expect(codes.has("lead.create")).toBe(true);
    expect(codes.has("lead.view_all")).toBe(true);
    expect(codes.has("lead.manage_custom_fields")).toBe(true);
  });

  it("defines owner and viewer system roles", () => {
    const codes = SYSTEM_ROLE_TEMPLATES.map((r) => r.code);
    expect(codes).toContain("owner");
    expect(codes).toContain("viewer");
    expect(codes).toContain("sales_manager");
  });

  it("owner template grants all permissions", () => {
    const owner = SYSTEM_ROLE_TEMPLATES.find((r) => r.code === "owner");
    expect(owner?.permissions).toBe("*");
  });
});

describe("slugify", () => {
  it("creates url-safe slugs", () => {
    expect(slugify("Acme Pvt Ltd")).toBe("acme-pvt-ltd");
    expect(slugify("  Hello!!! World  ")).toBe("hello-world");
  });
});

describe("assertSameOrganization", () => {
  it("allows matching organization ids", () => {
    expect(() => assertSameOrganization("org_a", "org_a")).not.toThrow();
  });

  it("rejects cross-tenant access", () => {
    expect(() => assertSameOrganization("org_a", "org_b")).toThrow(AppError);
    try {
      assertSameOrganization("org_a", "org_b");
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      expect((error as AppError).code).toBe("FORBIDDEN");
      expect((error as AppError).status).toBe(403);
    }
  });
});
