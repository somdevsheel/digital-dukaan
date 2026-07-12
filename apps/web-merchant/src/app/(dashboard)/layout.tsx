"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@platform/ui";
import { useAuth } from "../../lib/auth-context";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, status, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  if (status !== "authenticated") {
    // Covers both "loading" (silent refresh in flight) and "unauthenticated" (redirect
    // above hasn't navigated away yet) — never flash dashboard content before auth resolves.
    return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center justify-between border-b px-6 py-3">
        <span className="text-sm font-semibold">Merchant Dashboard</span>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{user?.fullName ?? user?.email ?? user?.phone}</span>
          <Button variant="outline" size="sm" onClick={() => logout()}>
            Sign out
          </Button>
        </div>
      </header>
      <main className="flex-1 bg-muted/30 p-6">{children}</main>
    </div>
  );
}
