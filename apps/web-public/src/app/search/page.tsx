import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@platform/ui";
import { searchBusinesses, listBusinessTypes, listCities, type SearchParams as ApiSearchParams } from "@/lib/api";
import { BusinessCard } from "@/components/business-card";
import { getParam, isActive, setParamHref, toggledHref, type RawSearchParams } from "./query";

const SORTS = ["relevance", "distance", "rating"] as const;

function isSort(value: string | undefined): value is ApiSearchParams["sort"] {
  return SORTS.includes(value as (typeof SORTS)[number]);
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}): Promise<Metadata> {
  const sp = await searchParams;
  const q = getParam(sp, "q");
  return { title: q ? `"${q}"` : "Browse businesses" };
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const sp = await searchParams;
  const q = getParam(sp, "q");
  const cityId = getParam(sp, "cityId");
  const businessTypeId = getParam(sp, "businessTypeId");
  const lat = getParam(sp, "lat");
  const lng = getParam(sp, "lng");
  const sort = getParam(sp, "sort");
  const view = getParam(sp, "view") === "map" ? "map" : "list";

  const [result, businessTypes, cities] = await Promise.all([
    searchBusinesses({
      q,
      cityId,
      businessTypeId,
      lat: lat ? Number(lat) : undefined,
      lng: lng ? Number(lng) : undefined,
      sort: isSort(sort) ? sort : lat ? "distance" : undefined,
      "filter[openNow]": isActive(sp, "openNow", "1") || undefined,
      "filter[deliveryAvailable]": isActive(sp, "delivery", "1") || undefined,
      "filter[pickupAvailable]": isActive(sp, "pickup", "1") || undefined,
      "filter[verified]": isActive(sp, "verified", "1") || undefined,
      "filter[rating]": isActive(sp, "rating", "4") ? 4 : undefined,
      cursor: getParam(sp, "cursor"),
    }),
    listBusinessTypes(),
    listCities(),
  ]);

  const cityName = cityId ? cities.find((c) => c.id === cityId)?.name : undefined;
  const typeName = businessTypeId ? businessTypes.find((t) => t.id === businessTypeId)?.name : undefined;
  const title = [typeName, cityName ? `in ${cityName}` : null].filter(Boolean).join(" ") || (q ? `Results for "${q}"` : "All businesses");

  const filters: { key: string; value: string; label: string }[] = [
    { key: "openNow", value: "1", label: "Open Now" },
    { key: "delivery", value: "1", label: "Delivery" },
    { key: "pickup", value: "1", label: "Pickup" },
    { key: "rating", value: "4", label: "Rating 4+" },
    { key: "verified", value: "1", label: "Verified" },
  ];

  return (
    <div className="container py-8">
      <h1 className="mb-4 text-2xl font-bold tracking-tight">{title}</h1>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {filters.map((f) => {
          const active = isActive(sp, f.key, f.value);
          return (
            <Link key={f.key} href={toggledHref(sp, f.key, f.value)}>
              <Badge variant={active ? "default" : "outline"} className="cursor-pointer">
                {f.label}
              </Badge>
            </Link>
          );
        })}
      </div>

      <div className="mb-6 flex items-center justify-between border-b pb-4">
        <div className="flex gap-1 rounded-lg bg-muted p-1 text-sm">
          <Link
            href={setParamHref(sp, "view", "list")}
            className={`rounded-md px-3 py-1 ${view === "list" ? "bg-background font-medium shadow-sm" : "text-muted-foreground"}`}
          >
            List
          </Link>
          <Link
            href={setParamHref(sp, "view", "map")}
            className={`rounded-md px-3 py-1 ${view === "map" ? "bg-background font-medium shadow-sm" : "text-muted-foreground"}`}
          >
            Map
          </Link>
        </div>
        <p className="text-sm text-muted-foreground">{result.hits.length} results</p>
      </div>

      {view === "map" ? (
        <div className="flex h-96 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
          Map view requires a Google Maps API key — not yet configured for this environment.
        </div>
      ) : result.hits.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          No businesses found. Try widening your search radius or clearing a filter.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {result.hits.map((hit) => (
            <BusinessCard key={hit.id} business={hit} />
          ))}
        </div>
      )}

      {result.nextCursor && (
        <div className="mt-6 flex justify-center">
          <Link href={setParamHref(sp, "cursor", result.nextCursor)} className="text-sm font-medium text-primary hover:underline">
            Load more
          </Link>
        </div>
      )}
    </div>
  );
}
