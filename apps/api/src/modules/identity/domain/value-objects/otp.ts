import { randomInt } from "node:crypto";

/** Pure policy constants — no I/O, no framework. Storage is a separate port (otp-store.port.ts). */
export const OTP_LENGTH = 6;
export const OTP_TTL_SECONDS = 5 * 60;
export const OTP_MAX_ATTEMPTS = 5;

export function generateOtpCode(): string {
  return randomInt(0, 10 ** OTP_LENGTH).toString().padStart(OTP_LENGTH, "0");
}
