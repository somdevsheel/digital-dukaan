export interface OAuthAccountRecord {
  id: string;
  userId: string;
  provider: "GOOGLE" | "APPLE";
  providerAccountId: string;
}

/** Port — implemented by infrastructure/persistence/prisma-oauth-account.repository.ts. */
export interface OAuthAccountRepository {
  findByProviderAccountId(provider: "GOOGLE" | "APPLE", providerAccountId: string): Promise<OAuthAccountRecord | null>;
  link(userId: string, provider: "GOOGLE" | "APPLE", providerAccountId: string): Promise<OAuthAccountRecord>;
}

export const OAUTH_ACCOUNT_REPOSITORY = Symbol("OAUTH_ACCOUNT_REPOSITORY");
