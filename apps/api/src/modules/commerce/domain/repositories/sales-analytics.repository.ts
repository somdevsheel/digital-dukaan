export interface DailySalesRecord {
  saleDate: string; // YYYY-MM-DD
  orderCount: number;
  revenuePaise: number;
  newCustomerCount: number;
}

/**
 * Port — reads from `business_sales_daily_mv` (Database Design §4.6), a materialized
 * view refreshed on a schedule by the Worker's `report-rollup` job, never a live
 * aggregate over `orders`. This is a deliberate accuracy/freshness trade-off the wireframe
 * calls out explicitly (Wireframes plate 11): dashboard numbers lag the refresh interval,
 * they never drift from the source of truth.
 */
export interface SalesAnalyticsRepository {
  /** Inclusive date range, ordered by saleDate ascending. */
  listDailyForBusiness(businessId: string, fromDate: string, toDate: string): Promise<DailySalesRecord[]>;
}

export const SALES_ANALYTICS_REPOSITORY = Symbol("SALES_ANALYTICS_REPOSITORY");
