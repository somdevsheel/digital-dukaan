"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Skeleton } from "@platform/ui";
import { apiFetch } from "../../lib/api-client";

interface Business {
  id: string;
  name: string;
  addressLine: string;
  verificationStatus: "PENDING" | "VERIFIED" | "REJECTED" | "SUSPENDED";
  isOpen: boolean;
}

const verificationBadgeVariant = {
  PENDING: "warning",
  VERIFIED: "success",
  REJECTED: "destructive",
  SUSPENDED: "secondary",
} as const;

export default function DashboardHomePage() {
  const { data: businesses, isLoading } = useQuery({
    queryKey: ["merchant", "businesses"],
    queryFn: () => apiFetch<Business[]>("/merchant/businesses"),
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        <Skeleton className="h-24 w-full max-w-2xl" />
        <Skeleton className="h-24 w-full max-w-2xl" />
      </div>
    );
  }

  if (!businesses || businesses.length === 0) {
    return (
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>Register your business</CardTitle>
          <CardDescription>
            You don&apos;t have a storefront yet. Set one up to start listing your catalog and taking orders.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/businesses/new">Register your business</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {businesses.map((business) => (
        <Link key={business.id} href={`/businesses/${business.id}/products`}>
          <Card className="max-w-2xl transition-colors hover:bg-muted/50">
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>{business.name}</CardTitle>
                <CardDescription>{business.addressLine}</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={business.isOpen ? "success" : "secondary"}>{business.isOpen ? "Open" : "Closed"}</Badge>
                <Badge variant={verificationBadgeVariant[business.verificationStatus]}>{business.verificationStatus}</Badge>
              </div>
            </CardHeader>
          </Card>
        </Link>
      ))}
    </div>
  );
}
