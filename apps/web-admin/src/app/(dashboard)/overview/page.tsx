"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, Skeleton, StatTile } from "@platform/ui";
import { apiFetch } from "../../../lib/api-client";

interface OverviewAnalytics {
  gmvPaiseMtd: number;
  activeBusinessCount: number;
  weeklyTransactingCustomers: number;
  fulfillmentRatePercent: number;
  openDisputeCount: number;
  openSupportTicketCount: number;
}

function formatGmv(paise: number): string {
  const rupees = paise / 100;
  if (rupees >= 100_000) return `₹${(rupees / 100_000).toFixed(1)}L`;
  return `₹${rupees.toLocaleString("en-IN")}`;
}

export default function OverviewDashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "analytics", "overview"],
    queryFn: () => apiFetch<OverviewAnalytics>("/admin/analytics/revenue"),
  });

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-4 gap-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-4 gap-4">
        <StatTile label="GMV (MTD)" value={formatGmv(data.gmvPaiseMtd)} />
        <StatTile label="Active businesses" value={data.activeBusinessCount} />
        <StatTile
          label="Weekly transacting customers"
          value={data.weeklyTransactingCustomers}
          hint="North Star metric — PRD §4"
        />
        <StatTile label="Fulfillment rate" value={`${data.fulfillmentRatePercent}%`} hint="Trailing 30 days" />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Open disputes</p>
          <p className="mt-1.5 text-2xl font-semibold tabular-nums">{data.openDisputeCount}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Support queue</p>
          <p className="mt-1.5 text-2xl font-semibold tabular-nums">{data.openSupportTicketCount}</p>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground">
        GMV refreshes periodically from a pre-aggregated rollup (~15 min lag); weekly transacting customers and
        fulfillment rate are live. Single-city at MVP — the city selector from the wireframe isn&apos;t built yet.
      </p>
    </div>
  );
}
