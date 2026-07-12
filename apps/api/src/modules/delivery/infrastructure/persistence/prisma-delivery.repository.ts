import { Injectable } from "@nestjs/common";
import type { Delivery } from "@prisma/client";
import { PrismaService } from "../../../../common/prisma/prisma.service";
import type {
  DeliveryOffer,
  DeliveryRecord,
  DeliveryRepository,
} from "../../domain/repositories/delivery.repository";

interface OfferRow {
  delivery_id: string;
  order_id: string;
  business_name: string;
  pickup_address: string;
  distance_meters: number;
}

const FLAT_EARNING_ESTIMATE_PAISE = 3000; // mirrors DeliveryUseCase's flat placeholder — shown pre-accept as an estimate

@Injectable()
export class PrismaDeliveryRepository implements DeliveryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createForOrder(orderId: string): Promise<DeliveryRecord> {
    const delivery = await this.prisma.delivery.create({ data: { orderId, status: "UNASSIGNED" } });
    return this.toRecord(delivery);
  }

  async findById(id: string): Promise<DeliveryRecord | null> {
    const delivery = await this.prisma.delivery.findUnique({ where: { id } });
    return delivery ? this.toRecord(delivery) : null;
  }

  async findByOrderId(orderId: string): Promise<DeliveryRecord | null> {
    const delivery = await this.prisma.delivery.findUnique({ where: { orderId } });
    return delivery ? this.toRecord(delivery) : null;
  }

  async listOffersNear(latitude: number, longitude: number, radiusMeters: number): Promise<DeliveryOffer[]> {
    // Joins through Order to Business for pickup location — Delivery itself has no
    // location of its own, only the order it's fulfilling does (Database Design §3).
    const rows = await this.prisma.$queryRaw<OfferRow[]>`
      SELECT
        d.id AS delivery_id, o.id AS order_id, b.name AS business_name, b.address_line AS pickup_address,
        ST_Distance(b.geog, ST_MakePoint(${longitude}, ${latitude})::geography) AS distance_meters
      FROM deliveries d
      JOIN orders o ON o.id = d.order_id
      JOIN businesses b ON b.id = o.business_id
      WHERE d.status = 'UNASSIGNED'
        AND o.status IN ('ACCEPTED', 'PACKING', 'READY')
        AND ST_DWithin(b.geog, ST_MakePoint(${longitude}, ${latitude})::geography, ${radiusMeters})
      ORDER BY distance_meters ASC
      LIMIT 50
    `;

    return rows.map((row) => ({
      deliveryId: row.delivery_id,
      orderId: row.order_id,
      businessName: row.business_name,
      pickupAddress: row.pickup_address,
      distanceMeters: row.distance_meters,
      estimatedEarningsPaise: FLAT_EARNING_ESTIMATE_PAISE,
    }));
  }

  async assign(deliveryId: string, deliveryPartnerId: string): Promise<boolean> {
    // The conditional WHERE is the entire "exactly one wins" mechanism — see this
    // repository interface's doc comment for why this replaces a Redis lock here.
    const result = await this.prisma.delivery.updateMany({
      where: { id: deliveryId, status: "UNASSIGNED", deliveryPartnerId: null },
      data: { deliveryPartnerId, status: "ASSIGNED", assignedAt: new Date() },
    });
    return result.count > 0;
  }

  async markPickedUp(deliveryId: string, otpHash: string): Promise<DeliveryRecord> {
    const delivery = await this.prisma.delivery.update({
      where: { id: deliveryId },
      data: { status: "OUT_FOR_DELIVERY", pickedUpAt: new Date(), otpCodeHash: otpHash },
    });
    return this.toRecord(delivery);
  }

  async getOtpHash(deliveryId: string): Promise<string | null> {
    const delivery = await this.prisma.delivery.findUnique({ where: { id: deliveryId }, select: { otpCodeHash: true } });
    return delivery?.otpCodeHash ?? null;
  }

  async markDelivered(deliveryId: string, earningsPaise: number): Promise<DeliveryRecord> {
    const delivery = await this.prisma.delivery.update({
      where: { id: deliveryId },
      data: { status: "DELIVERED", deliveredAt: new Date(), earningsPaise },
    });
    return this.toRecord(delivery);
  }

  async listForPartner(deliveryPartnerId: string, cursor?: string, limit = 20): Promise<DeliveryRecord[]> {
    const deliveries = await this.prisma.delivery.findMany({
      where: { deliveryPartnerId },
      orderBy: { assignedAt: "desc" },
      take: limit,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    return deliveries.map((d) => this.toRecord(d));
  }

  private toRecord(delivery: Delivery): DeliveryRecord {
    return {
      id: delivery.id,
      orderId: delivery.orderId,
      deliveryPartnerId: delivery.deliveryPartnerId,
      status: delivery.status,
      assignedAt: delivery.assignedAt,
      pickedUpAt: delivery.pickedUpAt,
      deliveredAt: delivery.deliveredAt,
      distanceMeters: delivery.distanceMeters,
      earningsPaise: delivery.earningsPaise,
    };
  }
}
