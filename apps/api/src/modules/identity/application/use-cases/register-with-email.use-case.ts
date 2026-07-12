import { Inject, Injectable } from "@nestjs/common";
import { USER_REPOSITORY, type UserRepository } from "../../domain/repositories/user.repository";
import {
  REFRESH_TOKEN_REPOSITORY,
  type RefreshTokenRepository,
} from "../../domain/repositories/refresh-token.repository";
import { ROLE_REPOSITORY, type RoleRepository } from "../../domain/repositories/role.repository";
import { PASSWORD_HASHER, type PasswordHasherPort } from "../../domain/services/password-hasher.port";
import { TOKEN_ISSUER, type TokenIssuerPort } from "../../domain/services/token-issuer.port";
import { EmailAlreadyRegisteredException } from "../../domain/errors/identity.errors";
import { hashToken } from "../../domain/value-objects/token-hash";
import type { RegisterEmailDto } from "../dto/register-email.dto";
import type { AuthResult } from "./auth-result";

@Injectable()
export class RegisterWithEmailUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY) private readonly refreshTokens: RefreshTokenRepository,
    @Inject(ROLE_REPOSITORY) private readonly roles: RoleRepository,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasherPort,
    @Inject(TOKEN_ISSUER) private readonly tokenIssuer: TokenIssuerPort,
  ) {}

  async execute(dto: RegisterEmailDto, context: { ipAddress?: string | undefined; userAgent?: string | undefined }): Promise<AuthResult> {
    const existing = await this.users.findByEmail(dto.email);
    if (existing) {
      throw new EmailAlreadyRegisteredException();
    }

    const passwordHash = await this.passwordHasher.hash(dto.password);
    const user = await this.users.create({
      email: dto.email,
      passwordHash,
      fullName: dto.fullName,
    });

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

    return { user, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, isNewUser: true };
  }
}
