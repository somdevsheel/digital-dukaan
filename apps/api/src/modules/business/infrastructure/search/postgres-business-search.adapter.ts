import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../../../common/prisma/prisma.service";
import type {
  BusinessSearchPort,
  BusinessSearchQuery,
  BusinessSearchResult,
} from "../../domain/services/business-search.port";

interface SearchRow {
  id: string;
  slug: string;
  name: string;
  business_type_name: string;
  logo_url: string | null;
  rating_avg: number;
  distance_meters: number | null;
  is_open: boolean;
  delivery_enabled: boolean;
  pickup_enabled: boolean;
  verification_status: string;
}

/**
 * Postgres/PostGIS-backed implementation of BUSINESS_SEARCH_PORT — see the port's own
 * doc comment for why this exists instead of Meilisearch for this pass. Uses raw SQL
 * (not Prisma's query builder) because geo-radius `ST_DWithin` and `ORDER BY distance`
 * aren't expressible through it — the same reason Database Design §4.5 already flagged
 * PostGIS as an `Unsupported` Prisma type.
 */
@Injectable()
export class PostgresBusinessSearchAdapter implements BusinessSearchPort {
  constructor(private readonly prisma: PrismaService) {}

  async search(query: BusinessSearchQuery): Promise<BusinessSearchResult> {
    const conditions: Prisma.Sql[] = [
      Prisma.sql`b.deleted_at IS NULL`,
      Prisma.sql`b.verification_status = 'VERIFIED'`,
    ];

    if (query.text) {
      conditions.push(Prisma.sql`b.name ILIKE ${"%" + query.text + "%"}`);
    }
    if (query.businessTypeId) {
      conditions.push(Prisma.sql`b.business_type_id = ${query.businessTypeId}::uuid`);
    }
    if (query.cityId) {
      conditions.push(Prisma.sql`b.city_id = ${query.cityId}::uuid`);
    }
    if (query.pinCode) {
      conditions.push(Prisma.sql`b.pin_code = ${query.pinCode}`);
    }
    if (query.filters.deliveryAvailable) {
      conditions.push(Prisma.sql`b.delivery_enabled = true`);
    }
    if (query.filters.pickupAvailable) {
      conditions.push(Prisma.sql`b.pickup_enabled = true`);
    }
    if (query.filters.openNow) {
      conditions.push(Prisma.sql`b.is_open = true`);
    }
    if (query.filters.verifiedOnly) {
      conditions.push(Prisma.sql`b.verification_status = 'VERIFIED'`);
    }
    if (query.near) {
      conditions.push(
        Prisma.sql`ST_DWithin(b.geog, ST_MakePoint(${query.near.longitude}, ${query.near.latitude})::geography, ${query.near.radiusMeters})`,
      );
    }
    // Pushed after the LATERAL join is written below (it references r.rating_avg, only
    // available once that join is in scope) — same conditions array, just appended later
    // in source order for readability; SQL evaluates the full WHERE together regardless.
    if (query.filters.minRating !== undefined) {
      conditions.push(Prisma.sql`COALESCE(r.rating_avg, 0) >= ${query.filters.minRating}`);
    }

    const distanceExpr = query.near
      ? Prisma.sql`ST_Distance(b.geog, ST_MakePoint(${query.near.longitude}, ${query.near.latitude})::geography)`
      : Prisma.sql`NULL`;

    const orderBy =
      query.sort === "distance" && query.near
        ? Prisma.sql`distance_meters ASC`
        : query.sort === "rating"
          ? Prisma.sql`rating_avg DESC`
          : Prisma.sql`b.created_at DESC`;

    const limit = query.limit + 1; // fetch one extra to know whether a next page exists
    const offset = query.cursor ? parseInt(query.cursor, 10) : 0;

    const rows = await this.prisma.$queryRaw<SearchRow[]>`
      SELECT
        b.id, b.slug, b.name, bt.name AS business_type_name, b.logo_url,
        COALESCE(r.rating_avg, 0) AS rating_avg,
        ${distanceExpr} AS distance_meters,
        b.is_open, b.delivery_enabled, b.pickup_enabled, b.verification_status
      FROM businesses b
      JOIN business_types bt ON bt.id = b.business_type_id
      LEFT JOIN LATERAL (
        SELECT AVG(rating)::float AS rating_avg FROM reviews WHERE business_id = b.id AND status = 'PUBLISHED'
      ) r ON true
      WHERE ${Prisma.join(conditions, " AND ")}
      ORDER BY ${orderBy}
      LIMIT ${limit} OFFSET ${offset}
    `;

    const hasMore = rows.length > query.limit;
    const hits = rows.slice(0, query.limit).map((row) => ({
      id: row.id,
      slug: row.slug,
      name: row.name,
      businessTypeName: row.business_type_name,
      logoUrl: row.logo_url,
      ratingAvg: row.rating_avg,
      distanceMeters: row.distance_meters,
      isOpen: row.is_open,
      deliveryEnabled: row.delivery_enabled,
      pickupEnabled: row.pickup_enabled,
      verificationStatus: row.verification_status,
    }));

    return { hits, nextCursor: hasMore ? String(offset + query.limit) : null };
  }
}
