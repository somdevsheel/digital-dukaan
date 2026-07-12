// Access token lives in memory only — never localStorage — so an XSS payload can't read
// a persistent copy of it; the httpOnly refresh-token cookie (set by the API, forwarded
// through next.config.js's rewrite) is what survives a page reload, and a silent refresh
// re-derives a fresh access token from it on load. Module-level, not React state: the
// fetch wrapper needs synchronous access outside any component's render cycle.
let accessToken: string | null = null;
const listeners = new Set<(token: string | null) => void>();

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
  listeners.forEach((listener) => listener(token));
}

export function subscribeToAccessToken(listener: (token: string | null) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
