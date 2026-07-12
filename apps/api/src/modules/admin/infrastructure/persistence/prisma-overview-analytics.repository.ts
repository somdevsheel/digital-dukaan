import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../../common/prisma/prisma.service";
import type { OverviewAnalyticsRecord, OverviewAnalyticsRepository } from "../../domain/repositories/overview-analytics.repository";

@Injectable()
export class PrismaOverviewAnalyticsRepository implements OverviewAnalyticsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async get(): Promise<OverviewAnalyticsRecord> {
    const [gmvRows, activeBusinessCount, wtcRows, fulfillmentRows, openDisputeCount, openSupportTicketCount] = await Promise.all([
      this.prisma.$queryRaw<{ gmv: bigint | null }[]>`
        SELECT SUM(revenue_paise)::bigint AS gmv
        FROM business_sales_daily_mv
        WHERE sale_date >= date_trunc('month', CURRENT_DATE)
      `,
      this.prisma.business.count({ where: { verificationStatus: "VERIFIED", deletedAt: null } }),
      this.prisma.$queryRaw<{ wtc: bigint }[]>`
        SELECT COUNT(DISTINCT user_id)::bigint AS wtc
        FROM orders
        WHERE status NOT IN ('CANCELLED', 'REJECTED')
          AND placed_at >= NOW() - INTERVAL '7 days'
      `,
      this.prisma.$queryRaw<{ fulfilled: bigint; terminal: bigint }[]>`
        SELECT
          COUNT(*) FILTER (WHERE status IN ('DELIVERED', 'COMPLETED'))::bigint AS fulfilled,
          COUNT(*) FILTER (WHERE status IN ('DELIVERED', 'COMPLETED', 'CANCELLED', 'REJECTED'))::bigint AS terminal
        FROM orders
        WHERE placed_at >= NOW() - INTERVAL '30 days'
      `,
      this.prisma.dispute.count({ where: { status: { in: ["OPEN", "INVESTIGATING"] } } }),
      this.prisma.supportTicket.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
    ]);

    const terminal = Number(fulfillmentRows[0]?.terminal ?? 0);
    const fulfilled = Number(fulfillmentRows[0]?.fulfilled ?? 0);

    return {
      gmvPaiseMtd: Number(gmvRows[0]?.gmv ?? 0),
      activeBusinessCount,
      weeklyTransactingCustomers: Number(wtcRows[0]?.wtc ?? 0),
      fulfillmentRatePercent: terminal > 0 ? Math.round((fulfilled / terminal) * 1000) / 10 : 0,
      openDisputeCount,
      openSupportTicketCount,
    };
  }
}
