import { randomBytes } from "node:crypto";
import type { ConfigService } from "@nestjs/config";
import { AesFieldEncryptionAdapter } from "./aes-field-encryption.adapter";

function makeAdapter(): AesFieldEncryptionAdapter {
  const key = randomBytes(32).toString("base64");
  const config = { getOrThrow: () => key } as unknown as ConfigService;
  return new AesFieldEncryptionAdapter(config);
}

describe("AesFieldEncryptionAdapter", () => {
  it("round-trips a plaintext value through encrypt/decrypt", () => {
    const adapter = makeAdapter();
    const plaintext = "1234567890123456"; // a plausible bank account number

    const ciphertext = adapter.encrypt(plaintext);
    expect(adapter.decrypt(ciphertext)).toBe(plaintext);
  });

  it("never stores the plaintext inside the ciphertext (Architecture §17)", () => {
    const adapter = makeAdapter();
    const plaintext = "SECRET-ACCOUNT-NUMBER";
    const ciphertext = adapter.encrypt(plaintext);
    expect(ciphertext).not.toContain(plaintext);
  });

  it("produces a different ciphertext each time for the same plaintext", () => {
    // A random IV per call (not a fixed/derived one) is what makes this true — if it
    // weren't, encrypting the same bank account number twice would leak that fact to
    // anyone who could see both rows, even without breaking the key.
    const adapter = makeAdapter();
    const a = adapter.encrypt("same-value");
    const b = adapter.encrypt("same-value");
    expect(a).not.toBe(b);
    expect(adapter.decrypt(a)).toBe("same-value");
    expect(adapter.decrypt(b)).toBe("same-value");
  });

  it("rejects a tampered ciphertext instead of silently returning corrupted data", () => {
    // This is the entire point of using GCM (authenticated encryption) over a plain CBC
    // mode: a flipped byte must be *detected*, not decrypted into garbage that looks valid.
    const adapter = makeAdapter();
    const ciphertext = adapter.encrypt("original-value");
    const tampered = Buffer.from(ciphertext, "base64");
    tampered[tampered.length - 1] = (tampered[tampered.length - 1] ?? 0) ^ 0xff;

    expect(() => adapter.decrypt(tampered.toString("base64"))).toThrow();
  });

  it("rejects a key that isn't exactly 32 bytes", () => {
    const shortKey = randomBytes(16).toString("base64");
    const config = { getOrThrow: () => shortKey } as unknown as ConfigService;
    expect(() => new AesFieldEncryptionAdapter(config)).toThrow(/32 bytes/);
  });
});
