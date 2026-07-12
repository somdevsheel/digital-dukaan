/**
 * Port — the SMS provider is abstracted per Architecture §12 (swappable MSG91/Twilio/etc.
 * without touching call sites). Local dev binds a console-logging adapter; see
 * infrastructure/external/console-otp-sender.ts.
 */
export interface OtpSenderPort {
  send(phone: string, code: string): Promise<void>;
}

export const OTP_SENDER = Symbol("OTP_SENDER");
