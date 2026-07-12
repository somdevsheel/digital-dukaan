import { Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Processor, WorkerHost } from "@nestjs/bullmq";
import type { Job } from "bullmq";
import { PrismaService } from "../prisma/prisma.service";

/**
 * Repeatable job (registered in app.module.ts's onModuleInit) — auto-cancels orders a
 * merchant never acted on within the timeout window, restoring reserved stock. This is a
 * deliberately simplified reimplementation of Commerce's cancellation logic
 * (OrderStatusUseCase in apps/api), not a shared import: apps/worker is a separate
 * deployable and doesn't reach into another app's src/ (Architecture §3) — only
 * `packages/*` is shared across app boundaries. Refunding an online payment for a
 * stale-cancelled order is intentionally out of scope here (PLACED means payment likely
 * never completed, so there's nothing to refund yet in the common case); a genuinely paid
 * stale order is rare enough to be a manual ops case for now.
 */
@Processor("maintenance")
export class StaleOrderCleanupProcessor extends WorkerHost {
  private readonly logger = new Logger(StaleOrderCleanupProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    if (job.name !== "stale-order-cleanup") return;

    const timeoutMinutes = this.config.get<number>("staleOrderTimeoutMinutes") ?? 15;
    const cutoff = new Date(Date.now() - timeoutMinutes * 60_000);

    const staleOrders = await this.prisma.order.findMany({
      where: { status: "PLACED", placedAt: { lt: cutoff } },
      include: { items: true },
    });

    for (const order of staleOrders) {
      await this.prisma.$transaction([
        this.prisma.order.update({
          where: { id: order.id },
          data: { status: "CANCELLED", cancelledAt: new Date(), cancelReason: `Auto-cancelled: no merchant response within ${timeoutMinutes}m` },
        }),
        this.prisma.orderStatusHistory.create({
          data: { orderId: order.id, fromStatus: "PLACED", toStatus: "CANCELLED", changedBy: null, note: "Automatic timeout cancellation" },
        }),
        ...order.items
          .filter((item) => item.productVariantId)
          .map((item) =>
            this.prisma.productVariant.update({
              where: { id: item.productVariantId! },
              data: { stockQuantity: { increment: item.quantity } },
            }),
          ),
      ]);
      this.logger.log(`Auto-cancelled stale order ${order.orderNumber}`);
    }
  }
}
