/**
 * A single permission grant, optionally scoped to a business. `businessId: null` means
 * the grant applies platform-wide (an Admin role) — see PermissionGuard for how this is
 * checked against a route's :businessId param.
 */
export interface PermissionGrant {
  permission: string;
  businessId: string | null;
}

/**
 * Shape embedded in the JWT access token and reconstructed by JwtStrategy on every
 * request. Grants are baked in at token issuance (login/refresh) rather than looked up
 * from the DB per-request — deliberate perf trade-off (Architecture's p95 targets) that
 * bounds permission-revocation staleness to one access-token TTL (15 min). Forced
 * logout-all-sessions (refresh-token-family revocation) is the mitigation for anything
 * more urgent than that window.
 */
export interface AuthenticatedUser {
  userId: string;
  grants: PermissionGrant[];
}
