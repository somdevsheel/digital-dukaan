export interface OverviewAnalyticsRecord {
  gmvPaiseMtd: number;
  activeBusinessCount: number;
  /** PRD's own North Star metric (§4): distinct customers with >=1 non-cancelled order in the trailing 7 days. */
  weeklyTransactingCustomers: number;
  /** Of orders reaching a terminal state in the trailing 30 days, the percentage that were fulfilled (DELIVERED/COMPLETED) rather than CANCELLED/REJECTED. */
  fulfillmentRatePercent: number;
  openDisputeCount: number;
  openSupportTicketCount: number;
}

/**
 * Port — a platform-wide reporting read, deliberately implemented via direct SQL across
 * Business/Commerce/Admin tables rather than composing each module's own repository port.
 * Same narrow, stated exception already made for PostgresBusinessSearchAdapter (Business
 * module): this is a read-only aggregation for an ops dashboard, not business logic, so
 * the usual per-module repository boundary isn't worth the composition overhead here.
 * GMV reads the same `business_sales_daily_mv` materialized view the merchant Sales
 * Dashboard uses (Database Design §4.6) — one source of truth for "revenue", not a second
 * calculation that could drift from it. WTC and fulfillment rate are live queries, not
 * materialized: both are trailing-window distinct-counts cheap enough not to need
 * pre-aggregation, and WTC specifically needs to reflect a rolling 7 days, not a calendar
 * bucket the materialized view is keyed by.
 */
export interface OverviewAnalyticsRepository {
  get(): Promise<OverviewAnalyticsRecord>;
}

export const OVERVIEW_ANALYTICS_REPOSITORY = Symbol("OVERVIEW_ANALYTICS_REPOSITORY");
