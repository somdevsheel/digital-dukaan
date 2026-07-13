import type { ExecutionContext } from "@nestjs/common";
import type { Reflector } from "@nestjs/core";
import { PermissionGuard } from "./permission.guard";
import { ForbiddenException } from "../errors/app.errors";
import type { AuthenticatedUser } from "../types/authenticated-user";

function makeContext(user: AuthenticatedUser | undefined, params: Record<string, string> = {}): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ user, params }) }),
    getHandler: () => undefined,
    getClass: () => undefined,
  } as unknown as ExecutionContext;
}

function makeGuard(requiredPermission: string | undefined): PermissionGuard {
  const reflector = { getAllAndOverride: () => requiredPermission } as unknown as Reflector;
  return new PermissionGuard(reflector);
}

describe("PermissionGuard", () => {
  it("allows any authenticated request through when the route declares no @RequirePermission", () => {
    const guard = makeGuard(undefined);
    expect(guard.canActivate(makeContext({ userId: "u1", grants: [] }))).toBe(true);
  });

  it("allows a platform-wide grant (businessId: null) regardless of the route's :businessId", () => {
    const guard = makeGuard("business.verify");
    const admin: AuthenticatedUser = { userId: "admin-1", grants: [{ permission: "business.verify", businessId: null }] };

    expect(guard.canActivate(makeContext(admin, { businessId: "biz-A" }))).toBe(true);
    expect(guard.canActivate(makeContext(admin, { businessId: "biz-B" }))).toBe(true);
    expect(guard.canActivate(makeContext(admin, {}))).toBe(true); // e.g. GET /admin/businesses, no :businessId at all
  });

  it("allows a business-scoped grant only for the matching :businessId", () => {
    const guard = makeGuard("order.accept");
    const staff: AuthenticatedUser = { userId: "staff-1", grants: [{ permission: "order.accept", businessId: "biz-A" }] };

    expect(guard.canActivate(makeContext(staff, { businessId: "biz-A" }))).toBe(true);
  });

  it("rejects a business-scoped grant for a different business — the core of the multi-tenant boundary", () => {
    const guard = makeGuard("order.accept");
    // A staff member at business A must never be able to act on business B's orders just
    // by changing the :businessId in the URL — this is the one test that would catch that
    // regression immediately.
    const staffOfBusinessA: AuthenticatedUser = { userId: "staff-1", grants: [{ permission: "order.accept", businessId: "biz-A" }] };

    expect(() => guard.canActivate(makeContext(staffOfBusinessA, { businessId: "biz-B" }))).toThrow(ForbiddenException);
  });

  it("rejects when the user has no grants at all", () => {
    const guard = makeGuard("business.manage");
    expect(() => guard.canActivate(makeContext({ userId: "u1", grants: [] }, { businessId: "biz-A" }))).toThrow(ForbiddenException);
  });

  it("rejects when the user has a grant for a different permission on the same business", () => {
    const guard = makeGuard("staff.manage");
    const staff: AuthenticatedUser = { userId: "staff-1", grants: [{ permission: "order.accept", businessId: "biz-A" }] };
    expect(() => guard.canActivate(makeContext(staff, { businessId: "biz-A" }))).toThrow(ForbiddenException);
  });
});
