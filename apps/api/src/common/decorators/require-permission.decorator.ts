import { SetMetadata } from "@nestjs/common";

export const PERMISSION_KEY = "requiredPermission";

/**
 * Declares the permission key (from the seeded `permissions` table, e.g. "order.accept")
 * a route requires. Enforced by PermissionGuard against the caller's JWT-embedded grants —
 * see Architecture §9: RBAC is checked server-side regardless of what the client UI shows.
 */
export const RequirePermission = (permission: string) => SetMetadata(PERMISSION_KEY, permission);
