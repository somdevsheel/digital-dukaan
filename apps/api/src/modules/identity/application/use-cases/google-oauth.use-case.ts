import { Inject, Injectable } from "@nestjs/common";
import { USER_REPOSITORY, type UserRepository } from "../../domain/repositories/user.repository";
import {
  OAUTH_ACCOUNT_REPOSITORY,
  type OAuthAccountRepository,
} from "../../domain/repositories/oauth-account.repository";
import {
  REFRESH_TOKEN_REPOSITORY,
  type RefreshTokenRepository,
} from "../../domain/repositories/refresh-token.repository";
import { ROLE_REPOSITORY, type RoleRepository } from "../../domain/repositories/role.repository";
import {
  GOOGLE_OAUTH_VERIFIER,
  type GoogleOAuthVerifierPort,
} from "../../domain/services/google-oauth-verifier.port";
import { TOKEN_ISSUER, type TokenIssuerPort } from "../../domain/services/token-issuer.port";
import { hashToken } from "../../domain/value-objects/token-hash";
import type { GoogleOAuthDto } from "../dto/google-oauth.dto";
import type { AuthResult } from "./auth-result";

@Injectable()
export class GoogleOAuthUseCase {
  constructor(
    @Inject(GOOGLE_OAUTH_VERIFIER) private readonly verifier: GoogleOAuthVerifierPort,
    @Inject(USER_REPOSITORY) private readonly users: UserRepository,
    @Inject(OAUTH_ACCOUNT_REPOSITORY) private readonly oauthAccounts: OAuthAccountRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY) private readonly refreshTokens: RefreshTokenRepository,
    @Inject(ROLE_REPOSITORY) private readonly roles: RoleRepository,
    @Inject(TOKEN_ISSUER) private readonly tokenIssuer: TokenIssuerPort,
  ) {}

  async execute(dto: GoogleOAuthDto, context: { ipAddress?: string | undefined; userAgent?: string | undefined }): Promise<AuthResult> {
    const profile = await this.verifier.verify(dto.idToken);

    const existingLink = await this.oauthAccounts.findByProviderAccountId("GOOGLE", profile.providerAccountId);
    let user = existingLink ? await this.users.findById(existingLink.userId) : null;
    let isNewUser = false;

    if (!user) {
      // Not linked yet — if an account with this email already exists (e.g. the user
      // originally registered via email/password), link Google to it rather than
      // creating a duplicate account for the same person.
      user = await this.users.findByEmail(profile.email);
      if (!user) {
        user = await this.users.create({
          email: profile.email,
          fullName: profile.fullName ?? undefined,
        });
        isNewUser = true;
      }
      await this.oauthAccounts.link(user.id, "GOOGLE", profile.providerAccountId);
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
