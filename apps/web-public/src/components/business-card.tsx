import Link from "next/link";
import { Star } from "lucide-react";
import { Badge } from "@platform/ui";
import type { BusinessSearchHit } from "@/lib/api";
import { formatDistance } from "@/lib/format";

export function BusinessCard({ business }: { business: BusinessSearchHit }) {
  return (
    <Link
      href={`/business/${business.slug}`}
      className="flex gap-3 rounded-lg border bg-card p-3 transition-shadow hover:shadow-md"
    >
      <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted text-xs text-muted-foreground">
        {business.logoUrl ? (
          <img src={business.logoUrl} alt={business.name} className="h-full w-full object-cover" />
        ) : (
          business.name.slice(0, 2).toUpperCase()
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate font-semibold">{business.name}</h3>
          {!business.isOpen && (
            <Badge variant="secondary" className="flex-shrink-0">
              Closed
            </Badge>
          )}
        </div>
        <p className="truncate text-sm text-muted-foreground">{business.businessTypeName}</p>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <span className="flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            {business.ratingAvg > 0 ? business.ratingAvg.toFixed(1) : "New"}
          </span>
          {business.distanceMeters !== null && (
            <span className="text-muted-foreground">{formatDistance(business.distanceMeters)}</span>
          )}
          {business.deliveryEnabled && <Badge variant="outline">Delivery</Badge>}
          {business.pickupEnabled && <Badge variant="outline">Pickup</Badge>}
        </div>
      </div>
    </Link>
  );
}
