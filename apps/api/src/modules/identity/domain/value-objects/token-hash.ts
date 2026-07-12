import { createHash } from "node:crypto";

// Refresh tokens are high-entropy random strings, not user-chosen secrets — a fast SHA-256
// digest (not Argon2/bcrypt) is the right tool here: it still means a DB read alone never
// yields a usable token, without the deliberate slowness that password hashing needs to
// resist brute force (irrelevant against a token with 256 bits of entropy).
export function hashToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}
