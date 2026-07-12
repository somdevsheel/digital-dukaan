import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import type { AuthenticatedUser } from "../../../../common/types/authenticated-user";

interface JwtPayload {
  sub: string;
  grants: AuthenticatedUser["grants"];
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>("jwt.accessSecret"),
    });
  }

  // Return value becomes `request.user` — exactly the AuthenticatedUser shape
  // CurrentUser/PermissionGuard expect, since it's decoded straight from what
  // JwtTokenIssuer signed.
  validate(payload: JwtPayload): AuthenticatedUser {
    return { userId: payload.sub, grants: payload.grants };
  }
}
