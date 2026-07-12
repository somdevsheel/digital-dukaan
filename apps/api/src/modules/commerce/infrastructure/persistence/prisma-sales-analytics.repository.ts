import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../../common/prisma/prisma.service";
import type { DailySalesRecord, SalesAnalyticsRepository } from "../../domain/repositories/sales-analytics.repository";

interface DailySalesRow {
  sale_date: Date;
  order_count: number;
  revenue_paise: bigint;
  new_customer_count: number;
}

@Injectable()
export class PrismaSalesAnalyticsRepository implements SalesAnalyticsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listDailyForBusiness(businessId: string, fromDate: string, toDate: string): Promise<DailySalesRecord[]> {
    const rows = await this.prisma.$queryRaw<DailySalesRow[]>`
      SELECT sale_date, order_count, revenue_paise, new_customer_count
      FROM business_sales_daily_mv
      WHERE business_id = ${businessId}::uuid
        AND sale_date BETWEEN ${fromDate}::date AND ${toDate}::date
      ORDER BY sale_date ASC
    `;
    return rows.map((row) => ({
      saleDate: row.sale_date.toISOString().slice(0, 10),
      orderCount: row.order_count,
      revenuePaise: Number(row.revenue_paise),
      newCustomerCount: row.new_customer_count,
    }));
  }
}
