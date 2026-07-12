import { Inject, Injectable } from "@nestjs/common";
import { OTP_STORE, type OtpStorePort } from "../../domain/services/otp-store.port";
import { OTP_SENDER, type OtpSenderPort } from "../../domain/services/otp-sender.port";
import { PASSWORD_HASHER, type PasswordHasherPort } from "../../domain/services/password-hasher.port";
import { generateOtpCode, OTP_TTL_SECONDS } from "../../domain/value-objects/otp";
import { OtpRateLimitedException } from "../../domain/errors/identity.errors";
import type { RequestOtpDto } from "../dto/request-otp.dto";

const RESEND_COOLDOWN_SECONDS = 60;

@Injectable()
export class RequestOtpUseCase {
  // Reuses the Argon2 password hasher, deliberately: a 6-digit code is low-entropy
  // (1M possibilities), so a *slow* hash is exactly what keeps a leaked hashedCode from
  // being brute-forced offline in seconds — the opposite reasoning from token-hash.ts.
  constructor(
    @Inject(OTP_STORE) private readonly otpStore: OtpStorePort,
    @Inject(OTP_SENDER) private readonly otpSender: OtpSenderPort,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasherPort,
  ) {}

  async execute(dto: RequestOtpDto): Promise<void> {
    const existing = await this.otpStore.get(dto.phone);
    if (existing) {
      const ageSeconds = OTP_TTL_SECONDS - (existing.expiresAt.getTime() - Date.now()) / 1000;
      if (ageSeconds < RESEND_COOLDOWN_SECONDS) {
        throw new OtpRateLimitedException();
      }
    }

    const code = generateOtpCode();
    const hashedCode = await this.hasher.hash(code);
    await this.otpStore.save(dto.phone, {
      hashedCode,
      attempts: 0,
      expiresAt: new Date(Date.now() + OTP_TTL_SECONDS * 1000),
    });

    await this.otpSender.send(dto.phone, code);
  }
}
