import { hashToken } from "./token-hash";

describe("hashToken", () => {
  it("is deterministic — the same input always hashes the same way", () => {
    const raw = "a-refresh-token-value";
    expect(hashToken(raw)).toBe(hashToken(raw));
  });

  it("produces different hashes for different inputs", () => {
    expect(hashToken("token-a")).not.toBe(hashToken("token-b"));
  });

  it("never returns the plaintext input itself", () => {
    const raw = "super-secret-refresh-token";
    expect(hashToken(raw)).not.toBe(raw);
  });

  it("produces a fixed-length hex digest regardless of input length", () => {
    expect(hashToken("short")).toHaveLength(64); // sha256 hex = 64 chars
    expect(hashToken("a".repeat(500))).toHaveLength(64);
  });
});
