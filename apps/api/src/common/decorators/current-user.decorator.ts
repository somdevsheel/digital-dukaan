import { createParamDecorator, type ExecutionContext } from "@nestjs/common";
import type { Request } from "express";
import type { AuthenticatedUser } from "../types/authenticated-user";

/** Injects the JWT-derived caller into a controller method: `@CurrentUser() user: AuthenticatedUser`. */
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
  const request = ctx.switchToHttp().getRequest<Request & { user: AuthenticatedUser }>();
  return request.user;
});
