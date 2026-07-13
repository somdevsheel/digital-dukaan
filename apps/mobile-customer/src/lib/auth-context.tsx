import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { apiFetch } from "./api";
import { getRefreshToken, setAccessToken, setRefreshToken } from "./token-store";

export interface MeUser {
  id: string;
  email: string | null;
  phone: string | null;
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
  requestOtp: (phone: string) => Promise<void>;
  verifyOtp: (phone: string, code: string) => Promise<{ isNewUser: boolean }>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
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
    // Cold start: there's no in-memory access token yet (module state doesn't survive an app
    // relaunch), only the refresh token persisted in SecureStore — mirrors the web apps'
    // silent-refresh-on-load, adapted for the fact native has no httpOnly cookie to carry it.
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

  const requestOtp = useCallback(async (phone: string) => {
    await apiFetch("/auth/otp/request", { method: "POST", authenticated: false, body: { phone } });
  }, []);

  const verifyOtp = useCallback(async (phone: string, code: string) => {
    const result = await apiFetch<SessionResponse>("/auth/otp/verify", {
      method: "POST",
      authenticated: false,
      body: { phone, code },
    });
    setAccessToken(result.accessToken);
    await setRefreshToken(result.refreshToken);
    setUser(result.user);
    setStatus("authenticated");
    return { isNewUser: result.user.isNewUser };
  }, []);

  const logout = useCallback(async () => {
    const refreshToken = await getRefreshToken();
    await apiFetch("/auth/logout", { method: "POST", body: { refreshToken } }).catch(() => undefined);
    setAccessToken(null);
    await setRefreshToken(null);
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  return (
    <AuthContext.Provider value={{ user, status, requestOtp, verifyOtp, logout, refreshMe: fetchMe }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
