import { randomInt } from "node:crypto";

// 4 digits, not 6 (auth OTP's length) — deliberately shorter: this code is read aloud by
// the customer and typed by the delivery partner face-to-face in a few seconds, not
// received over SMS with time to copy-paste. Still hashed at rest (Argon2, via the
// shared PasswordHasherPort) for the same low-entropy brute-force reasoning as auth OTPs.
export const DELIVERY_OTP_LENGTH = 4;

export function generateDeliveryOtp(): string {
  return randomInt(0, 10 ** DELIVERY_OTP_LENGTH).toString().padStart(DELIVERY_OTP_LENGTH, "0");
}
