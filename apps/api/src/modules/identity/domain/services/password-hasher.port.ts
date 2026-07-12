/** Port — Argon2id in infrastructure (OWASP's current first recommendation), never bcrypt/md5/plain. */
export interface PasswordHasherPort {
  hash(plaintext: string): Promise<string>;
  verify(hash: string, plaintext: string): Promise<boolean>;
}

export const PASSWORD_HASHER = Symbol("PASSWORD_HASHER");
