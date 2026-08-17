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
