import { randomBytes, randomUUID } from "node:crypto";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import ms from "ms";
import type { PermissionGrant } from "../../../../common/types/authenticated-user";
import type { TokenIssuerPort, TokenPair } from "../../domain/services/token-issuer.port";

// The refresh token is a high-entropy opaque string, NOT a JWT — it's looked up directly
// against its stored hash (Database Design: RefreshToken.tokenHash), never decoded. Only
// the short-lived access token is a JWT, carrying the grants PermissionGuard reads.
@Injectable()
export class JwtTokenIssuer implements TokenIssuerPort {
  constructor(
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async issueAccessToken(userId: string, grants: PermissionGrant[]): Promise<string> {
    return this.jwt.signAsync(
      { sub: userId, grants },
      {
        secret: this.config.getOrThrow<string>("jwt.accessSecret"),
        expiresIn: this.config.get<string>("jwt.accessTtl") ?? "15m",
      },
    );
  }

  async issuePair(userId: string, grants: PermissionGrant[], familyId?: string): Promise<TokenPair> {
    const accessToken = await this.issueAccessToken(userId, grants);
    const refreshToken = randomBytes(48).toString("hex");
    const refreshTtl = this.config.get<string>("jwt.refreshTtl") ?? "30d";

    return {
      accessToken,
      refreshToken,
      refreshTokenFamilyId: familyId ?? randomUUID(),
      refreshTokenExpiresAt: new Date(Date.now() + ms(refreshTtl)),
    };
  }
}
