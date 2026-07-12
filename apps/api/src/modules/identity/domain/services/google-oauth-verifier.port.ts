export interface GoogleProfile {
  providerAccountId: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
}

/** Port — verifies a Google-issued ID token server-side; never trust an unverified client claim. */
export interface GoogleOAuthVerifierPort {
  verify(idToken: string): Promise<GoogleProfile>;
}

export const GOOGLE_OAUTH_VERIFIER = Symbol("GOOGLE_OAUTH_VERIFIER");
