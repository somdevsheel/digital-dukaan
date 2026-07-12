"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@platform/ui";
import { apiFetch } from "../../../../lib/api-client";

interface Business {
  id: string;
  name: string;
}

const TABS = [
  { href: "products", label: "Products" },
  { href: "orders", label: "Orders" },
  { href: "sales", label: "Sales" },
  { href: "coupons", label: "Coupons" },
  { href: "staff", label: "Staff" },
];

export default function BusinessLayout({ children }: { children: ReactNode }) {
  const { id: businessId } = useParams<{ id: string }>();
  const pathname = usePathname();

  const { data: business } = useQuery({
    queryKey: ["merchant", "business", businessId],
    queryFn: () => apiFetch<Business>(`/merchant/businesses/${businessId}`),
  });

  return (
    <div>
      <h1 className="mb-1 text-xl font-semibold">{business?.name ?? "Business"}</h1>
      <nav className="mb-6 flex gap-1 border-b">
        {TABS.map((tab) => {
          const href = `/businesses/${businessId}/${tab.href}`;
          const active = pathname === href;
          return (
            <Link
              key={tab.href}
              href={href}
              className={cn(
                "border-b-2 px-3 py-2 text-sm font-medium",
                active ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
      {children}
    </div>
  );
}
