"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "./api-client";
import { setAccessToken } from "./token-store";

export interface MeUser {
  id: string;
  email: string | null;
  phone: string | null;
  fullName: string | null;
}

interface AuthContextValue {
  user: MeUser | null;
  status: "loading" | "authenticated" | "unauthenticated";
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MeUser | null>(null);
  const [status, setStatus] = useState<AuthContextValue["status"]>("loading");
  const router = useRouter();

  const fetchMe = useCallback(async () => {
    const me = await apiFetch<MeUser>("/me");
    setUser(me);
    setStatus("authenticated");
  }, []);

  useEffect(() => {
    // Silent refresh on load — the httpOnly refresh cookie (Architecture §9) is the only
    // thing that survives a page reload; the in-memory access token does not, by design.
    apiFetch<{ accessToken: string }>("/auth/refresh", { method: "POST", authenticated: false })
      .then((result) => {
        setAccessToken(result.accessToken);
        return fetchMe();
      })
      .catch(() => setStatus("unauthenticated"));
  }, [fetchMe]);

  const login = useCallback(
    async (email: string, password: string) => {
      const result = await apiFetch<{ accessToken: string }>("/auth/login/email", {
        method: "POST",
        body: { email, password },
        authenticated: false,
      });
      setAccessToken(result.accessToken);
      await fetchMe();
      router.push("/");
    },
    [fetchMe, router],
  );

  const logout = useCallback(async () => {
    await apiFetch("/auth/logout", { method: "POST", body: {} }).catch(() => undefined);
    setAccessToken(null);
    setUser(null);
    setStatus("unauthenticated");
    router.push("/login");
  }, [router]);

  return <AuthContext.Provider value={{ user, status, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
