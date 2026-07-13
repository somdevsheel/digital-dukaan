import type { Service } from "@/lib/api";
import { formatRupees } from "@/lib/format";

export function ServiceCard({ service }: { service: Service }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-medium">{service.name}</h3>
        <span className="flex-shrink-0 text-sm font-semibold">{formatRupees(service.pricePaise)}</span>
      </div>
      {service.description && <p className="mt-1 text-sm text-muted-foreground">{service.description}</p>}
      {service.durationMinutes && (
        <p className="mt-1 text-xs text-muted-foreground">~{service.durationMinutes} min</p>
      )}
    </div>
  );
}
