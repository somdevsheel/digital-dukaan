import { Inject, Injectable } from "@nestjs/common";
import { USER_REPOSITORY, type UserRepository } from "../../domain/repositories/user.repository";
import {
  REFRESH_TOKEN_REPOSITORY,
  type RefreshTokenRepository,
} from "../../domain/repositories/refresh-token.repository";
import { ROLE_REPOSITORY, type RoleRepository } from "../../domain/repositories/role.repository";
import { PASSWORD_HASHER, type PasswordHasherPort } from "../../domain/services/password-hasher.port";
import { TOKEN_ISSUER, type TokenIssuerPort } from "../../domain/services/token-issuer.port";
import { ForbiddenException } from "../../../../common/errors/app.errors";
import { InvalidCredentialsException } from "../../domain/errors/identity.errors";
import { hashToken } from "../../domain/value-objects/token-hash";
import type { LoginEmailDto } from "../dto/login-email.dto";
import type { AuthResult } from "./auth-result";

@Injectable()
export class LoginWithEmailUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY) private readonly refreshTokens: RefreshTokenRepository,
    @Inject(ROLE_REPOSITORY) private readonly roles: RoleRepository,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasherPort,
    @Inject(TOKEN_ISSUER) private readonly tokenIssuer: TokenIssuerPort,
  ) {}

  async execute(dto: LoginEmailDto, context: { ipAddress?: string | undefined; userAgent?: string | undefined }): Promise<AuthResult> {
    const user = await this.users.findByEmail(dto.email);
    if (!user || !user.passwordHash) {
      throw new InvalidCredentialsException();
    }

    const isValid = await this.passwordHasher.verify(user.passwordHash, dto.password);
    if (!isValid) {
      throw new InvalidCredentialsException();
    }
    if (user.status !== "ACTIVE") {
      throw new ForbiddenException("This account has been suspended. Contact support.");
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

    return { user, accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, isNewUser: false };
  }
}
