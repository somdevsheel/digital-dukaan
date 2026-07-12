export interface BusinessSearchQuery {
  text?: string | undefined;
  businessTypeId?: string | undefined;
  cityId?: string | undefined;
  pinCode?: string | undefined;
  near?: { latitude: number; longitude: number; radiusMeters: number } | undefined;
  filters: {
    minRating?: number | undefined;
    openNow?: boolean | undefined;
    deliveryAvailable?: boolean | undefined;
    pickupAvailable?: boolean | undefined;
    verifiedOnly?: boolean | undefined;
  };
  sort: "relevance" | "distance" | "rating";
  cursor?: string | undefined;
  limit: number;
}

export interface BusinessSearchHit {
  id: string;
  slug: string;
  name: string;
  businessTypeName: string;
  logoUrl: string | null;
  ratingAvg: number;
  distanceMeters: number | null;
  isOpen: boolean;
  deliveryEnabled: boolean;
  pickupEnabled: boolean;
  verificationStatus: string;
}

export interface BusinessSearchResult {
  hits: BusinessSearchHit[];
  nextCursor: string | null;
}

/**
 * Port — Architecture §11 targets Meilisearch (fast fuzzy + geo-radius) fed by an
 * async event->queue->indexer pipeline. That pipeline spans a second deployable
 * (`apps/worker`) that doesn't exist yet as of this pass. `PostgresBusinessSearchAdapter`
 * (infrastructure/search/) is a fully working, honest implementation of this exact same
 * port using PostGIS + trigram text search — not a stub — so discovery search is real and
 * correct today. Swapping in a `MeilisearchBusinessSearchAdapter` later is a DI binding
 * change (Architecture §5's whole point), not a rewrite of any caller.
 */
export interface BusinessSearchPort {
  search(query: BusinessSearchQuery): Promise<BusinessSearchResult>;
}

export const BUSINESS_SEARCH_PORT = Symbol("BUSINESS_SEARCH_PORT");
