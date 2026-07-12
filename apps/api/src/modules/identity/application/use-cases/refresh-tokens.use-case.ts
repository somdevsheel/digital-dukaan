import { Inject, Injectable } from "@nestjs/common";
import { USER_REPOSITORY, type UserRepository } from "../../domain/repositories/user.repository";
import {
  REFRESH_TOKEN_REPOSITORY,
  type RefreshTokenRepository,
} from "../../domain/repositories/refresh-token.repository";
import { ROLE_REPOSITORY, type RoleRepository } from "../../domain/repositories/role.repository";
import { TOKEN_ISSUER, type TokenIssuerPort } from "../../domain/services/token-issuer.port";
import { UnauthenticatedException } from "../../../../common/errors/app.errors";
import { RefreshTokenReuseDetectedException } from "../../domain/errors/identity.errors";
import { hashToken } from "../../domain/value-objects/token-hash";

export interface RefreshedTokens {
  accessToken: string;
  refreshToken: string;
}

/**
 * Rotation with reuse detection, per Architecture §9: a refresh token is single-use.
 * Presenting one that was already rotated out (revokedAt set) means either a legitimate
 * client double-submitted a retry, OR a stolen token is being replayed after the real
 * client already rotated past it — since we can't distinguish those, we fail safe and
 * kill every session in the token's family, forcing re-authentication everywhere.
 */
@Injectable()
export class RefreshTokensUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY) private readonly refreshTokens: RefreshTokenRepository,
    @Inject(ROLE_REPOSITORY) private readonly roles: RoleRepository,
    @Inject(TOKEN_ISSUER) private readonly tokenIssuer: TokenIssuerPort,
  ) {}

  async execute(
    rawRefreshToken: string,
    context: { ipAddress?: string | undefined; userAgent?: string | undefined },
  ): Promise<RefreshedTokens> {
    const tokenHash = hashToken(rawRefreshToken);
    const record = await this.refreshTokens.findByTokenHash(tokenHash);

    if (!record) {
      throw new UnauthenticatedException("Invalid refresh token");
    }
    if (record.revokedAt) {
      await this.refreshTokens.revokeFamily(record.familyId);
      throw new RefreshTokenReuseDetectedException();
    }
    if (record.expiresAt.getTime() < Date.now()) {
      throw new UnauthenticatedException("Refresh token expired — please sign in again");
    }

    const user = await this.users.findById(record.userId);
    if (!user || user.status !== "ACTIVE") {
      throw new UnauthenticatedException();
    }

    await this.refreshTokens.revoke(record.id);

    const grants = await this.roles.resolveGrantsForUser(user.id);
    const tokens = await this.tokenIssuer.issuePair(user.id, grants, record.familyId);
    await this.refreshTokens.create({
      userId: user.id,
      tokenHash: hashToken(tokens.refreshToken),
      familyId: tokens.refreshTokenFamilyId,
      expiresAt: tokens.refreshTokenExpiresAt,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });

    return { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken };
  }
}
