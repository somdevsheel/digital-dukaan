import type { PermissionGrant } from "../../../../common/types/authenticated-user";

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  refreshTokenFamilyId: string;
  refreshTokenExpiresAt: Date;
}

/** Port — JWT signing lives in infrastructure/security/jwt-token-issuer.ts. */
export interface TokenIssuerPort {
  issuePair(userId: string, grants: PermissionGrant[], familyId?: string): Promise<TokenPair>;

  /**
   * Re-mints just the access token with a fresh grant set, leaving the refresh token/
   * session untouched. Needed whenever an action changes the caller's *own* permissions
   * mid-session (e.g. registering a business grants BUSINESS_OWNER immediately) — without
   * this, PermissionGuard's JWT-embedded grants (Architecture §9's staleness trade-off)
   * would block the user from their own just-completed action for up to one access-token
   * TTL. Not used for changes to *other* users' grants (e.g. inviting staff) — that
   * staleness window is acceptable since it's not blocking the actor's own next request.
   */
  issueAccessToken(userId: string, grants: PermissionGrant[]): Promise<string>;
}

export const TOKEN_ISSUER = Symbol("TOKEN_ISSUER");
