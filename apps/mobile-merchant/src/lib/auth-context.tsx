import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { apiFetch } from "./api";
import { getRefreshToken, setAccessToken, setRefreshToken } from "./token-store";

export interface MeUser {
  id: string;
  email: string | null;
  fullName: string | null;
}

interface SessionResponse {
  user: MeUser & { isNewUser: boolean };
  accessToken: string;
  refreshToken: string;
}

interface AuthContextValue {
  user: MeUser | null;
  status: "loading" | "authenticated" | "unauthenticated";
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  /** Swaps in a freshly re-minted access token — needed right after registering a new
   *  business, whose BUSINESS_OWNER grant isn't on the token that was current before. */
  applyAccessToken: (token: string) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MeUser | null>(null);
  const [status, setStatus] = useState<AuthContextValue["status"]>("loading");

  const fetchMe = useCallback(async () => {
    const me = await apiFetch<MeUser>("/me");
    setUser(me);
    setStatus("authenticated");
  }, []);

  useEffect(() => {
    // Cold start: no in-memory access token yet (module state doesn't survive an app
    // relaunch), only the refresh token persisted in SecureStore.
    void (async () => {
      const refreshToken = await getRefreshToken();
      if (!refreshToken) {
        setStatus("unauthenticated");
        return;
      }
      try {
        const result = await apiFetch<{ accessToken: string; refreshToken: string }>("/auth/refresh", {
          method: "POST",
          authenticated: false,
          body: { refreshToken },
        });
        setAccessToken(result.accessToken);
        await setRefreshToken(result.refreshToken);
        await fetchMe();
      } catch {
        setStatus("unauthenticated");
      }
    })();
  }, [fetchMe]);

  const login = useCallback(async (email: string, password: string) => {
    const result = await apiFetch<SessionResponse>("/auth/login/email", {
      method: "POST",
      authenticated: false,
      body: { email, password },
    });
    setAccessToken(result.accessToken);
    await setRefreshToken(result.refreshToken);
    setUser(result.user);
    setStatus("authenticated");
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = await getRefreshToken();
    await apiFetch("/auth/logout", { method: "POST", body: { refreshToken } }).catch(() => undefined);
    setAccessToken(null);
    await setRefreshToken(null);
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  const applyAccessToken = useCallback((token: string) => {
    setAccessToken(token);
  }, []);

  return (
    <AuthContext.Provider value={{ user, status, login, logout, applyAccessToken }}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
