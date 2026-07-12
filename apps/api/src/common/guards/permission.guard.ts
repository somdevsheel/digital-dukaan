import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";
import { PERMISSION_KEY } from "../decorators/require-permission.decorator";
import { ForbiddenException } from "../errors/app.errors";
import type { AuthenticatedUser } from "../types/authenticated-user";

/**
 * Runs after JwtAuthGuard. A route with no @RequirePermission() metadata is left to
 * JwtAuthGuard alone (authenticated-but-unscoped, e.g. GET /me). Business-scoped grants
 * match against the route's :businessId param — a BUSINESS_STAFF grant for business A
 * never satisfies a request for business B, regardless of permission key.
 */
@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string | undefined>(PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required) return true;

    const request = context.switchToHttp().getRequest<Request>();
    const user = request.user as AuthenticatedUser | undefined;
    const routeBusinessId = request.params?.businessId ?? null;

    const hasGrant = (user?.grants ?? []).some((grant) => {
      if (grant.permission !== required) return false;
      if (grant.businessId === null) return true; // platform-wide grant (admin)
      return routeBusinessId !== null && grant.businessId === routeBusinessId;
    });

    if (!hasGrant) {
      throw new ForbiddenException();
    }
    return true;
  }
}
