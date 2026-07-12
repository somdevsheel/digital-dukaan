export interface OtpRecord {
  hashedCode: string;
  attempts: number;
  expiresAt: Date;
}

/**
 * Port — OTPs are ephemeral (Database Design deliberately has no `otps` table; a 5-minute
 * value has no business reason to live in Postgres). Redis-backed in infrastructure, keyed
 * by phone number, hashed at rest per Architecture §9 ("never stored plaintext").
 */
export interface OtpStorePort {
  save(phone: string, record: OtpRecord): Promise<void>;
  get(phone: string): Promise<OtpRecord | null>;
  incrementAttempts(phone: string): Promise<number>;
  clear(phone: string): Promise<void>;
}

export const OTP_STORE = Symbol("OTP_STORE");
