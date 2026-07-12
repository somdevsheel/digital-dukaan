export interface RefreshTokenRecord {
  id: string;
  userId: string;
  tokenHash: string;
  familyId: string;
  ipAddress: string | null;
  userAgent: string | null;
  expiresAt: Date;
  revokedAt: Date | null;
  createdAt: Date;
}

export interface CreateRefreshTokenInput {
  userId: string;
  tokenHash: string;
  familyId: string;
  ipAddress?: string | undefined;
  userAgent?: string | undefined;
  expiresAt: Date;
}

/**
 * Port — implemented by infrastructure/persistence/prisma-refresh-token.repository.ts.
 * `revokeFamily` is the reuse-detection mechanism from Architecture §9: presenting an
 * already-rotated-out token revokes every token sharing its familyId, forcing re-auth.
 */
export interface RefreshTokenRepository {
  create(input: CreateRefreshTokenInput): Promise<RefreshTokenRecord>;
  findByTokenHash(tokenHash: string): Promise<RefreshTokenRecord | null>;
  revoke(id: string): Promise<void>;
  revokeFamily(familyId: string): Promise<void>;
  listActiveForUser(userId: string): Promise<RefreshTokenRecord[]>;
}

export const REFRESH_TOKEN_REPOSITORY = Symbol("REFRESH_TOKEN_REPOSITORY");
