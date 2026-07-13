import { RefreshTokensUseCase } from "./refresh-tokens.use-case";
import type { RefreshTokenRecord, RefreshTokenRepository } from "../../domain/repositories/refresh-token.repository";
import type { UserRecord, UserRepository } from "../../domain/repositories/user.repository";
import type { RoleRepository } from "../../domain/repositories/role.repository";
import type { TokenIssuerPort } from "../../domain/services/token-issuer.port";
import { hashToken } from "../../domain/value-objects/token-hash";
import { UnauthenticatedException } from "../../../../common/errors/app.errors";
import { RefreshTokenReuseDetectedException } from "../../domain/errors/identity.errors";

const RAW_TOKEN = "raw-refresh-token-value";

function makeRecord(overrides: Partial<RefreshTokenRecord> = {}): RefreshTokenRecord {
  return {
    id: "rt-1",
    userId: "user-1",
    tokenHash: hashToken(RAW_TOKEN),
    familyId: "family-1",
    ipAddress: null,
    userAgent: null,
    expiresAt: new Date(Date.now() + 86_400_000),
    revokedAt: null,
    createdAt: new Date(),
    ...overrides,
  };
}

const ACTIVE_USER: UserRecord = {
  id: "user-1",
  email: "test@example.com",
  phone: null,
  passwordHash: null,
  fullName: "Test User",
  avatarUrl: null,
  emailVerifiedAt: null,
  phoneVerifiedAt: null,
  status: "ACTIVE",
  createdAt: new Date(),
};

function makeUseCase(record: RefreshTokenRecord | null, user: UserRecord | null = ACTIVE_USER) {
  const revokeFamily = jest.fn().mockResolvedValue(undefined);
  const revoke = jest.fn().mockResolvedValue(undefined);
  const create = jest.fn().mockResolvedValue(undefined);
  const issuePair = jest.fn().mockResolvedValue({
    accessToken: "new-access-token",
    refreshToken: "new-raw-refresh-token",
    refreshTokenFamilyId: record?.familyId ?? "family-1",
    refreshTokenExpiresAt: new Date(Date.now() + 86_400_000),
  });

  const refreshTokens: Pick<RefreshTokenRepository, "findByTokenHash" | "revokeFamily" | "revoke" | "create"> = {
    findByTokenHash: () => Promise.resolve(record),
    revokeFamily,
    revoke,
    create,
  };
  const users: Pick<UserRepository, "findById"> = { findById: () => Promise.resolve(user) };
  // RoleRepository has exactly one method — this Pick is already structurally identical
  // to the full interface, so no cast is needed to pass it where RoleRepository is expected.
  const roles: RoleRepository = { resolveGrantsForUser: () => Promise.resolve([]) };
  const tokenIssuer: TokenIssuerPort = { issuePair, issueAccessToken: jest.fn() };

  const useCase = new RefreshTokensUseCase(
    users as unknown as UserRepository,
    refreshTokens as unknown as RefreshTokenRepository,
    roles,
    tokenIssuer,
  );
  return { useCase, revokeFamily, revoke, create, issuePair };
}

describe("RefreshTokensUseCase", () => {
  it("rejects a token with no matching record", async () => {
    const { useCase } = makeUseCase(null);
    await expect(useCase.execute(RAW_TOKEN, {})).rejects.toThrow(UnauthenticatedException);
  });

  it("rejects an expired-but-not-yet-rotated token", async () => {
    const { useCase } = makeUseCase(makeRecord({ expiresAt: new Date(Date.now() - 1000) }));
    await expect(useCase.execute(RAW_TOKEN, {})).rejects.toThrow(UnauthenticatedException);
  });

  it("rejects when the associated user is no longer active", async () => {
    const { useCase } = makeUseCase(makeRecord(), { ...ACTIVE_USER, status: "SUSPENDED" });
    await expect(useCase.execute(RAW_TOKEN, {})).rejects.toThrow(UnauthenticatedException);
  });

  it("rotates a valid token: revokes the old one, issues a new pair in the same family", async () => {
    const { useCase, revoke, create, issuePair } = makeUseCase(makeRecord({ id: "rt-1", familyId: "family-1" }));
    const result = await useCase.execute(RAW_TOKEN, { ipAddress: "1.2.3.4" });

    expect(revoke).toHaveBeenCalledWith("rt-1");
    expect(issuePair).toHaveBeenCalledWith("user-1", [], "family-1");
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ userId: "user-1", familyId: "family-1" }));
    expect(result.accessToken).toBe("new-access-token");
  });

  it("THE critical case: presenting an already-rotated-out token revokes the entire family and throws", async () => {
    // This is the reuse-detection guarantee the whole design hinges on (Architecture §9):
    // a stolen refresh token replayed after the legitimate client already rotated past it
    // must nuke every session in that family, not just quietly fail.
    const { useCase, revokeFamily, revoke } = makeUseCase(makeRecord({ familyId: "family-1", revokedAt: new Date() }));

    await expect(useCase.execute(RAW_TOKEN, {})).rejects.toThrow(RefreshTokenReuseDetectedException);
    expect(revokeFamily).toHaveBeenCalledWith("family-1");
    expect(revoke).not.toHaveBeenCalled(); // reuse path must not also try to rotate the token normally
  });
});
