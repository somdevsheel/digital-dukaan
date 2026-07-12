import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../../common/prisma/prisma.service";
import type {
  DeliveryEarningRecord,
  DeliveryEarningRepository,
  DeliveryEarningType,
} from "../../domain/repositories/delivery-earning.repository";

@Injectable()
export class PrismaDeliveryEarningRepository implements DeliveryEarningRepository {
  constructor(private readonly prisma: PrismaService) {}

  credit(deliveryPartnerId: string, deliveryId: string | null, type: DeliveryEarningType, amountPaise: number): Promise<DeliveryEarningRecord> {
    return this.prisma.deliveryEarning.create({
      data: { deliveryPartnerId, deliveryId, type, amountPaise, status: "PENDING" },
    });
  }

  listForPartner(deliveryPartnerId: string, cursor?: string, limit = 20): Promise<DeliveryEarningRecord[]> {
    return this.prisma.deliveryEarning.findMany({
      where: { deliveryPartnerId },
      orderBy: { createdAt: "desc" },
      take: limit,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
  }

  async getAvailableBalance(deliveryPartnerId: string): Promise<number> {
    // Derived, never a stored column (Database Design §4.1) — DEDUCTION rows carry a
    // negative amountPaise, so a plain SUM already nets them out correctly.
    const result = await this.prisma.deliveryEarning.aggregate({
      where: { deliveryPartnerId },
      _sum: { amountPaise: true },
    });
    return result._sum.amountPaise ?? 0;
  }
}
