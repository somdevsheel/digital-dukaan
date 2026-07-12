import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { OAuth2Client } from "google-auth-library";
import { UnauthenticatedException } from "../../../../common/errors/app.errors";
import type { GoogleOAuthVerifierPort, GoogleProfile } from "../../domain/services/google-oauth-verifier.port";

@Injectable()
export class GoogleOAuthVerifierAdapter implements GoogleOAuthVerifierPort {
  private readonly client: OAuth2Client;

  constructor(private readonly config: ConfigService) {
    this.client = new OAuth2Client(this.config.get<string>("googleOAuth.clientId"));
  }

  async verify(idToken: string): Promise<GoogleProfile> {
    const audience = this.config.get<string>("googleOAuth.clientId");
    const ticket = await this.client
      .verifyIdToken({ idToken, ...(audience !== undefined ? { audience } : {}) })
      .catch(() => null);

    const payload = ticket?.getPayload();
    if (!payload?.sub || !payload.email) {
      throw new UnauthenticatedException("Invalid Google sign-in token");
    }

    return {
      providerAccountId: payload.sub,
      email: payload.email,
      fullName: payload.name ?? null,
      avatarUrl: payload.picture ?? null,
    };
  }
}
