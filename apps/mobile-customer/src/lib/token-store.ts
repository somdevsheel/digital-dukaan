import * as SecureStore from "expo-secure-store";

const REFRESH_TOKEN_KEY = "marketplace.refreshToken";

// Access token: in-memory only, same reasoning as the web apps' token-store — never persisted,
// so it can't leak from disk; re-derived from the refresh token on cold start.
// Refresh token: there's no httpOnly-cookie equivalent on native, so expo-secure-store (backed
// by iOS Keychain / Android Keystore) is the closest analog — encrypted at rest, app-scoped.
let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export async function getRefreshToken(): Promise<string | null> {
  return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
}

export async function setRefreshToken(token: string | null): Promise<void> {
  if (token) {
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, token);
  } else {
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  }
}
