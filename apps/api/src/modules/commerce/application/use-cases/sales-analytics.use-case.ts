import { Inject, Injectable } from "@nestjs/common";
import {
  SALES_ANALYTICS_REPOSITORY,
  type SalesAnalyticsRepository,
} from "../../domain/repositories/sales-analytics.repository";

export type SalesRange = "today" | "week" | "month";

export interface SalesSummary {
  revenuePaise: number;
  orderCount: number;
  newCustomerCount: number;
  trend: { date: string; revenuePaise: number }[];
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return d;
}

const RANGE_DAYS: Record<SalesRange, number> = { today: 0, week: 6, month: 29 };
const TREND_DAYS = 6; // always the last 7 calendar days, independent of the range selector

@Injectable()
export class SalesAnalyticsUseCase {
  constructor(@Inject(SALES_ANALYTICS_REPOSITORY) private readonly analytics: SalesAnalyticsRepository) {}

  async getSummary(businessId: string, range: SalesRange): Promise<SalesSummary> {
    const spanFrom = isoDate(daysAgo(Math.max(RANGE_DAYS[range], TREND_DAYS)));
    const today = isoDate(new Date());
    const rows = await this.analytics.listDailyForBusiness(businessId, spanFrom, today);
    const byDate = new Map(rows.map((r) => [r.saleDate, r]));

    const rangeFrom = isoDate(daysAgo(RANGE_DAYS[range]));
    const rangeRows = rows.filter((r) => r.saleDate >= rangeFrom);

    const trend: { date: string; revenuePaise: number }[] = [];
    for (let i = TREND_DAYS; i >= 0; i--) {
      const date = isoDate(daysAgo(i));
      trend.push({ date, revenuePaise: byDate.get(date)?.revenuePaise ?? 0 });
    }

    return {
      revenuePaise: rangeRows.reduce((sum, r) => sum + r.revenuePaise, 0),
      orderCount: rangeRows.reduce((sum, r) => sum + r.orderCount, 0),
      newCustomerCount: rangeRows.reduce((sum, r) => sum + r.newCustomerCount, 0),
      trend,
    };
  }
}
