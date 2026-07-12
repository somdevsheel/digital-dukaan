import { Logger } from "@nestjs/common";
import { Processor, WorkerHost } from "@nestjs/bullmq";
import type { Job } from "bullmq";
import { PrismaService } from "../prisma/prisma.service";

/**
 * Repeatable job (registered in app.module.ts's onModuleInit) — refreshes the
 * `business_sales_daily_mv` materialized view (Database Design §4.6) that backs the
 * merchant/admin sales dashboards. CONCURRENTLY so reads against the view are never
 * blocked for the refresh's duration (the unique index added alongside the view in its
 * migration is what makes CONCURRENTLY possible at all).
 */
@Processor("maintenance")
export class ReportRollupProcessor extends WorkerHost {
  private readonly logger = new Logger(ReportRollupProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job): Promise<void> {
    if (job.name !== "report-rollup") return;

    await this.prisma.$executeRawUnsafe("REFRESH MATERIALIZED VIEW CONCURRENTLY business_sales_daily_mv");
    this.logger.log("Refreshed business_sales_daily_mv");
  }
}
