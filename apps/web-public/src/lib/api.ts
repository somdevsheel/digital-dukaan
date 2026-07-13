const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

interface ApiSuccessEnvelope<T> {
  data: T;
  meta?: { nextCursor?: string | null; hasMore?: boolean };
}
interface ApiErrorEnvelope {
  error: { code: string; message: string; details?: Record<string, unknown> };
}

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// Every route this app calls is @Public() on the API (discovery, reviews-read) — no auth
// token, no cookies. Revalidated hourly rather than fully static so a merchant going
// verified/open-closed shows up without a full redeploy, but still cacheable at the edge.
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    let envelope: ApiErrorEnvelope | null = null;
    try {
      envelope = (await response.json()) as ApiErrorEnvelope;
    } catch {
      // Non-JSON error body — fall through to the generic message below.
    }
    throw new ApiError(
      envelope?.error.code ?? "INTERNAL_ERROR",
      envelope?.error.message ?? `Request failed with status ${response.status}`,
      response.status,
    );
  }

  const parsed = (await response.json()) as ApiSuccessEnvelope<T>;
  return parsed.data;
}

export interface BusinessType {
  id: string;
  name: string;
  commerceModel: "PRODUCT" | "SERVICE";
  icon: string | null;
  sortOrder: number;
}

export interface City {
  id: string;
  name: string;
  state: string;
  isActive: boolean;
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

export interface Business {
  id: string;
  ownerUserId: string;
  businessTypeId: string;
  cityId: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  verificationStatus: "PENDING" | "VERIFIED" | "REJECTED" | "SUSPENDED";
  addressLine: string;
  pinCode: string;
  latitude: number;
  longitude: number;
  minOrderAmountPaise: number;
  avgPrepTimeMinutes: number | null;
  pickupEnabled: boolean;
  deliveryEnabled: boolean;
  codEnabled: boolean;
  isOpen: boolean;
}

export interface ProductVariant {
  id: string;
  name: string;
  pricePaise: number;
  stockQuantity: number;
  isActive: boolean;
}

export interface Product {
  id: string;
  businessId: string;
  categoryId: string | null;
  name: string;
  slug: string;
  description: string | null;
  brand: string | null;
  basePricePaise: number;
  compareAtPricePaise: number | null;
  isActive: boolean;
  variants: ProductVariant[];
  images: { id: string; url: string; sortOrder: number }[];
}

export interface Service {
  id: string;
  businessId: string;
  categoryId: string | null;
  name: string;
  description: string | null;
  pricePaise: number;
  durationMinutes: number | null;
  isActive: boolean;
  images: { id: string; url: string; sortOrder: number }[];
}

export interface Review {
  id: string;
  userId: string;
  businessId: string;
  rating: number;
  comment: string | null;
  reply: { message: string; createdAt: string } | null;
  createdAt: string;
}

export interface SearchParams {
  q?: string | undefined;
  businessTypeId?: string | undefined;
  cityId?: string | undefined;
  lat?: number | undefined;
  lng?: number | undefined;
  radiusM?: number | undefined;
  "filter[rating]"?: number | undefined;
  "filter[openNow]"?: boolean | undefined;
  "filter[deliveryAvailable]"?: boolean | undefined;
  "filter[pickupAvailable]"?: boolean | undefined;
  "filter[verified]"?: boolean | undefined;
  sort?: "relevance" | "distance" | "rating" | undefined;
  cursor?: string | undefined;
}

export function listBusinessTypes(): Promise<BusinessType[]> {
  return apiFetch<BusinessType[]>("/business-types");
}

export function listCities(): Promise<City[]> {
  return apiFetch<City[]>("/cities");
}

export function searchBusinesses(params: SearchParams): Promise<BusinessSearchResult> {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") qs.set(key, String(value));
  }
  const suffix = qs.toString();
  return apiFetch<BusinessSearchResult>(`/businesses${suffix ? `?${suffix}` : ""}`);
}

export function getBusinessBySlug(slug: string): Promise<Business> {
  return apiFetch<Business>(`/businesses/${slug}`);
}

export function listProducts(businessId: string, categoryId?: string): Promise<Product[]> {
  return apiFetch<Product[]>(`/businesses/${businessId}/products${categoryId ? `?categoryId=${categoryId}` : ""}`);
}

export function listServices(businessId: string, categoryId?: string): Promise<Service[]> {
  return apiFetch<Service[]>(`/businesses/${businessId}/services${categoryId ? `?categoryId=${categoryId}` : ""}`);
}

export function listReviews(businessId: string, cursor?: string): Promise<Review[]> {
  return apiFetch<Review[]>(`/businesses/${businessId}/reviews${cursor ? `?cursor=${cursor}` : ""}`);
}
