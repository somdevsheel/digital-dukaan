// Typed accessor for process.env — mirrors apps/api/src/common/config/configuration.ts's
// convention of centralizing raw env reads in one place so nothing else in this service
// touches process.env directly.

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export interface Env {
  nodeEnv: string;
  port: number;
  redisUrl: string;
  jwtAccessSecret: string;
  logLevel: string;
}

export const env: Env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: parseInt(process.env.PORT ?? "4001", 10),
  redisUrl: required("REDIS_URL"),
  // MUST be byte-identical to apps/api's JWT_ACCESS_SECRET (apps/api/src/common/config/
  // configuration.ts -> jwt.accessSecret) — verified by reading apps/api's JwtStrategy and
  // JwtTokenIssuer directly. A token minted by POST /api/v1/auth/login/email (or
  // otp/verify, refresh) is signed with that same secret/algorithm/payload shape, so it
  // authenticates a socket connection here too, with no separate realtime-only auth scheme.
  jwtAccessSecret: required("JWT_ACCESS_SECRET"),
  logLevel: process.env.LOG_LEVEL ?? "info",
};
