import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { FieldEncryptionPort } from "./field-encryption.port";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;

// AES-256-GCM with a key from a dedicated env var (32 bytes, base64) — not the JWT or DB
// secret reused for a different purpose. Ciphertext packs iv + authTag + data so a single
// opaque string is what's stored in the DB column.
@Injectable()
export class AesFieldEncryptionAdapter implements FieldEncryptionPort {
  private readonly key: Buffer;

  constructor(config: ConfigService) {
    const base64Key = config.getOrThrow<string>("fieldEncryptionKey");
    this.key = Buffer.from(base64Key, "base64");
    if (this.key.length !== 32) {
      throw new Error("FIELD_ENCRYPTION_KEY must decode to exactly 32 bytes (AES-256)");
    }
  }

  encrypt(plaintext: string): string {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITHM, this.key, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
    const authTag = cipher.getAuthTag();
    return Buffer.concat([iv, authTag, encrypted]).toString("base64");
  }

  decrypt(ciphertext: string): string {
    const raw = Buffer.from(ciphertext, "base64");
    const iv = raw.subarray(0, IV_LENGTH);
    const authTag = raw.subarray(IV_LENGTH, IV_LENGTH + 16);
    const encrypted = raw.subarray(IV_LENGTH + 16);
    const decipher = createDecipheriv(ALGORITHM, this.key, iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
  }
}
