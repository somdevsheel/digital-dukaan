import type { PermissionGrant } from "../../../../common/types/authenticated-user";

/**
 * Port — resolves the full set of permission grants for a user (platform roles with
 * businessId=null, plus every business-scoped UserRole they hold) in one call, used at
 * login/refresh to bake grants into the JWT (see AuthenticatedUser's staleness trade-off).
 */
export interface RoleRepository {
  resolveGrantsForUser(userId: string): Promise<PermissionGrant[]>;
}

export const ROLE_REPOSITORY = Symbol("ROLE_REPOSITORY");
