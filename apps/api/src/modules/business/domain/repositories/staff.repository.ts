export interface StaffMemberRecord {
  userRoleId: string;
  userId: string;
  userFullName: string | null;
  userEmail: string | null;
  roleName: string;
}

/**
 * Port — a deliberate exception to strict per-module table ownership (Database Design's
 * convention): "business staff" persists through Identity's `UserRole`/`Role` tables, but
 * PRD's "Staff Management" is a Business Owner Dashboard feature, not an Identity concern.
 * Forcing every staff operation through an exported Identity service would add an awkward
 * cross-module dependency for a feature that conceptually belongs here — the same
 * pragmatic call already made for admin verification staying in this module rather than a
 * separate Admin module. The shared Postgres database (Architecture §7) is what makes
 * this workable without duplicating data.
 */
export interface StaffRepository {
  listForBusiness(businessId: string): Promise<StaffMemberRecord[]>;
  invite(businessId: string, userId: string, roleName: "BUSINESS_OWNER" | "BUSINESS_STAFF"): Promise<StaffMemberRecord>;
  remove(userRoleId: string): Promise<void>;
  /** Every business this user owns or staffs — the merchant dashboard's own entry point has no other way to discover "which business(es) do I manage." */
  listBusinessIdsForUser(userId: string): Promise<string[]>;
}

export const STAFF_REPOSITORY = Symbol("STAFF_REPOSITORY");
