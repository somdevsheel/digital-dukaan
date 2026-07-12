"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Card, Skeleton, StatTile, Tabs, TabsList, TabsTrigger } from "@platform/ui";
import { apiFetch } from "../../../../../lib/api-client";

type SalesRange = "today" | "week" | "month";

interface SalesSummary {
  revenuePaise: number;
  orderCount: number;
  newCustomerCount: number;
  trend: { date: string; revenuePaise: number }[];
}

function formatRupees(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDayLabel(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00Z`).toLocaleDateString("en-IN", { weekday: "short", timeZone: "UTC" });
}

// Single-series magnitude-over-time — sequential bars in the design system's primary
// token (not a separate chart palette) so this reads as part of the same app, not a
// bolted-on widget. No legend needed for one series; the axis label + title carry identity.
function RevenueTrendChart({ trend }: { trend: { date: string; revenuePaise: number }[] }) {
  const max = Math.max(...trend.map((t) => t.revenuePaise), 1);
  const allZero = trend.every((t) => t.revenuePaise === 0);

  return (
    <Card className="p-4">
      <p className="mb-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">7-day revenue trend</p>
      {allZero ? (
        <p className="py-8 text-center text-sm text-muted-foreground">No sales in the last 7 days yet.</p>
      ) : (
        <div className="flex h-40 items-end gap-2">
          {trend.map((day) => (
            <div key={day.date} className="group relative flex flex-1 flex-col items-center gap-1.5">
              <div className="relative flex h-32 w-full items-end">
                <div
                  className="w-full rounded-t-sm bg-primary transition-opacity group-hover:opacity-80"
                  style={{ height: `${Math.max((day.revenuePaise / max) * 100, day.revenuePaise > 0 ? 4 : 0)}%` }}
                />
                <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-xs font-medium text-background opacity-0 transition-opacity group-hover:opacity-100">
                  {formatRupees(day.revenuePaise)}
                </div>
              </div>
              <span className="text-[11px] text-muted-foreground">{formatDayLabel(day.date)}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export default function SalesPage() {
  const { id: businessId } = useParams<{ id: string }>();
  const [range, setRange] = useState<SalesRange>("today");

  const { data, isLoading } = useQuery({
    queryKey: ["merchant", "sales", businessId, range],
    queryFn: () => apiFetch<SalesSummary>(`/merchant/businesses/${businessId}/analytics/sales?range=${range}`),
  });

  return (
    <div className="flex flex-col gap-4">
      <Tabs value={range} onValueChange={(v) => setRange(v as SalesRange)}>
        <TabsList>
          <TabsTrigger value="today">Today</TabsTrigger>
          <TabsTrigger value="week">Week</TabsTrigger>
          <TabsTrigger value="month">Month</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading || !data ? (
        <div className="grid grid-cols-4 gap-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-4 gap-4">
            <StatTile label="Revenue" value={formatRupees(data.revenuePaise)} />
            <StatTile label="Orders" value={data.orderCount} />
            <StatTile label="New customers" value={data.newCustomerCount} />
            <StatTile
              label="Avg. order value"
              value={data.orderCount > 0 ? formatRupees(data.revenuePaise / data.orderCount) : formatRupees(0)}
            />
          </div>
          <RevenueTrendChart trend={data.trend} />
          <p className="text-xs text-muted-foreground">
            Figures refresh periodically from a pre-aggregated rollup, not live — they may lag by up to ~15 minutes.
          </p>
        </>
      )}
    </div>
  );
}
