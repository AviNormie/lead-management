import { describe, expect, it, beforeAll } from "vitest";
import { encrypt, decrypt } from "@/lib/crypto/encryption";

describe("encryption", () => {
  beforeAll(() => {
    process.env.ENCRYPTION_KEY = "test-encryption-key-32chars!!";
  });

  it("round-trips plaintext", () => {
    const secret = "access-token-xyz";
    const sealed = encrypt(secret);
    expect(sealed).not.toContain(secret);
    expect(decrypt(sealed)).toBe(secret);
  });
});
