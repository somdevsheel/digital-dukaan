import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../../common/prisma/prisma.service";
import type { CashCollectionRecord, CashCollectionRepository } from "../../domain/repositories/cash-collection.repository";

@Injectable()
export class PrismaCashCollectionRepository implements CashCollectionRepository {
  constructor(private readonly prisma: PrismaService) {}

  createForOrder(orderId: string, deliveryPartnerId: string, amountPaise: number): Promise<CashCollectionRecord> {
    return this.prisma.cashCollection.create({
      data: { orderId, deliveryPartnerId, amountPaise, status: "PENDING" },
    });
  }

  async markCollected(orderId: string): Promise<void> {
    await this.prisma.cashCollection.update({ where: { orderId }, data: { status: "COLLECTED", collectedAt: new Date() } });
  }

  async getPendingRemittanceTotal(deliveryPartnerId: string): Promise<number> {
    const result = await this.prisma.cashCollection.aggregate({
      where: { deliveryPartnerId, status: "COLLECTED" },
      _sum: { amountPaise: true },
    });
    return result._sum.amountPaise ?? 0;
  }
}
