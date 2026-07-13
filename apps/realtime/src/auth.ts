import jwt from "jsonwebtoken";
import { env } from "./env";
import type { AppSocket, PermissionGrant } from "./events";
import { logger } from "./logger";

function extractToken(socket: AppSocket): string | null {
  const authValue = (socket.handshake.auth as Record<string, unknown> | undefined)?.token;
  if (typeof authValue === "string" && authValue.length > 0) {
    return authValue;
  }
  const header = socket.handshake.headers.authorization;
  if (typeof header === "string" && header.startsWith("Bearer ")) {
    return header.slice("Bearer ".length);
  }
  return null;
}

function isPermissionGrant(value: unknown): value is PermissionGrant {
  if (typeof value !== "object" || value === null) return false;
  const grant = value as Record<string, unknown>;
  return typeof grant.permission === "string" && (grant.businessId === null || typeof grant.businessId === "string");
}

/**
 * Socket.IO connection middleware (io.use) — every socket must present the identical JWT
 * apps/api issues from POST /auth/login/email, /auth/otp/verify, and /auth/refresh. Same
 * secret (JWT_ACCESS_SECRET), same algorithm (HS256 — apps/api's JwtTokenIssuer calls
 * JwtService.signAsync with a plain secret string and no `algorithm` option, which is
 * jsonwebtoken's HS256 default), same `{ sub, grants }` payload
 * (apps/api/src/modules/identity/presentation/strategies/jwt.strategy.ts). Algorithms are
 * pinned explicitly here (rather than left to jsonwebtoken's default) to rule out
 * algorithm-confusion attacks regardless of what a future apps/api change might do.
 *
 * Token is read from `socket.handshake.auth.token` (the idiomatic socket.io-client way:
 * `io(url, { auth: { token } })`) or, as a fallback, an `Authorization: Bearer <token>`
 * handshake header — covering clients that build the handshake with plain HTTP headers
 * instead of the socket.io-client `auth` option.
 */
export function socketAuthMiddleware(socket: AppSocket, next: (err?: Error) => void): void {
  const token = extractToken(socket);
  if (!token) {
    next(new Error("UNAUTHORIZED: missing token"));
    return;
  }

  try {
    const decoded = jwt.verify(token, env.jwtAccessSecret, { algorithms: ["HS256"] });
    if (typeof decoded !== "object" || decoded === null || typeof decoded.sub !== "string") {
      throw new Error("malformed access token payload");
    }
    const grantsRaw = (decoded as Record<string, unknown>).grants;
    const grants = Array.isArray(grantsRaw) ? grantsRaw.filter(isPermissionGrant) : [];

    socket.data.userId = decoded.sub;
    socket.data.grants = grants;
    next();
  } catch (err) {
    logger.warn({ err: (err as Error).message, socketId: socket.id }, "socket auth rejected");
    next(new Error("UNAUTHORIZED: invalid token"));
  }
}
