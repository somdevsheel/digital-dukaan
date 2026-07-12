/**
 * Field-level encryption for the specific highest-sensitivity columns called out in
 * Architecture §17 (bank account numbers, GST/PAN document refs) — defense in depth
 * beyond whole-disk/managed-Postgres encryption, for the fields that matter most if the
 * database itself is ever exposed. Not for general-purpose use on ordinary columns.
 */
export interface FieldEncryptionPort {
  encrypt(plaintext: string): string;
  decrypt(ciphertext: string): string;
}

export const FIELD_ENCRYPTION_PORT = Symbol("FIELD_ENCRYPTION_PORT");
