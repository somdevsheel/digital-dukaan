import { Inject, Injectable } from "@nestjs/common";
import { OTP_STORE, type OtpStorePort } from "../../domain/services/otp-store.port";
import { USER_REPOSITORY, type UserRepository } from "../../domain/repositories/user.repository";
import {
  REFRESH_TOKEN_REPOSITORY,
  type RefreshTokenRepository,
} from "../../domain/repositories/refresh-token.repository";
import { ROLE_REPOSITORY, type RoleRepository } from "../../domain/repositories/role.repository";
import { PASSWORD_HASHER, type PasswordHasherPort } from "../../domain/services/password-hasher.port";
import { TOKEN_ISSUER, type TokenIssuerPort } from "../../domain/services/token-issuer.port";
import { OTP_MAX_ATTEMPTS } from "../../domain/value-objects/otp";
import { hashToken } from "../../domain/value-objects/token-hash";
import { InvalidOtpException } from "../../domain/errors/identity.errors";
import type { VerifyOtpDto } from "../dto/verify-otp.dto";
import type { AuthResult } from "./auth-result";

@Injectable()
export class VerifyOtpUseCase {
  constructor(
    @Inject(OTP_STORE) private readonly otpStore: OtpStorePort,
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY) private readonly refreshTokens: RefreshTokenRepository,
    @Inject(ROLE_REPOSITORY) private readonly roles: RoleRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasherPort,
    @Inject(TOKEN_ISSUER) private readonly tokenIssuer: TokenIssuerPort,
  ) {}

  async execute(dto: VerifyOtpDto, context: { ipAddress?: string | undefined; userAgent?: string | undefined }): Promise<AuthResult> {
    const record = await this.otpStore.get(dto.phone);

    if (!record || record.expiresAt.getTime() < Date.now() || record.attempts >= OTP_MAX_ATTEMPTS) {
      throw new InvalidOtpException(0);
    }

    const isValid = await this.hasher.verify(record.hashedCode, dto.code);
    if (!isValid) {
      const attempts = await this.otpStore.incrementAttempts(dto.phone);
      throw new InvalidOtpException(Math.max(OTP_MAX_ATTEMPTS - attempts, 0));
    }

    await this.otpStore.clear(dto.phone);

    let user = await this.users.findByPhone(dto.phone);
    const isNewUser = !user;
    if (!user) {
      user = await this.users.create({ phone: dto.phone });
    }
    if (!user.phoneVerifiedAt) {
      user = await this.users.update(user.id, { phoneVerifiedAt: new Date() });
    }

    const grants = await this.roles.resolveGrantsForUser(user.id);
    const tokens = await this.tokenIssuer.issuePair(user.id, grants);
    await this.refreshTokens.create({
      userId: user.id,
      tokenHash: hashToken(tokens.refreshToken),
      familyId: tokens.refreshTokenFamilyId,
      expiresAt: tokens.refreshTokenExpiresAt,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    return { user, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, isNewUser };
  }
}
