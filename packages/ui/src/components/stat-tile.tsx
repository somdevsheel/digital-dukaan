import type { ReactNode } from "react";
import { cn } from "../lib/cn";
import { Card } from "./card";

export interface StatTileProps {
  label: string;
  value: ReactNode;
  hint?: string;
  trend?: { direction: "up" | "down"; label: string };
  className?: string;
}

export function StatTile({ label, value, hint, trend, className }: StatTileProps) {
  return (
    <Card className={cn("p-4", className)}>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1.5 text-2xl font-semibold tabular-nums">{value}</p>
      {trend ? (
        <p className={cn("mt-1 text-xs font-medium", trend.direction === "up" ? "text-emerald-600" : "text-red-600")}>
          {trend.direction === "up" ? "↑" : "↓"} {trend.label}
        </p>
      ) : hint ? (
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </Card>
  );
}
