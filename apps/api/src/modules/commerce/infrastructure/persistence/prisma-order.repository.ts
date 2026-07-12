import { randomBytes } from "node:crypto";
import { Injectable } from "@nestjs/common";
import type { Order, OrderItem } from "@prisma/client";
import { PrismaService } from "../../../../common/prisma/prisma.service";
import type {
  OrderPaymentStatus,
  OrderRecord,
  OrderRepository,
  OrderStatus,
  OrderStatusHistoryRecord,
  PlaceOrderInput,
  PlaceOrderResult,
} from "../../domain/repositories/order.repository";
import { OrderNotFoundException } from "../../domain/errors/commerce.errors";

type OrderWithItems = Order & { items: OrderItem[] };

// Internal sentinel — thrown inside the transaction to trigger rollback, caught immediately
// outside it. Never escapes this file.
class StockReservationFailed extends Error {
  constructor(public readonly unavailableVariantIds: string[]) {
    super("stock reservation failed");
  }
}

function generateOrderNumber(): string {
  const year = new Date().getFullYear();
  return `ORD-${year}-${randomBytes(4).toString("hex").toUpperCase()}`;
}

@Injectable()
export class PrismaOrderRepository implements OrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  async placeOrder(input: PlaceOrderInput): Promise<PlaceOrderResult> {
    try {
      const order = await this.prisma.$transaction(async (tx) => {
        // Reserve stock for every line first — if any single item fails, the whole
        // reservation (including any variants already decremented earlier in this loop)
        // rolls back with the transaction (Database Design §6).
        const unavailable: string[] = [];
        for (const item of input.items) {
          const result = await tx.productVariant.updateMany({
            where: { id: item.productVariantId, stockQuantity: { gte: item.quantity } },
            data: { stockQuantity: { decrement: item.quantity } },
          });
          if (result.count === 0) unavailable.push(item.productVariantId);
        }
        if (unavailable.length > 0) {
          throw new StockReservationFailed(unavailable);
        }

        const created = await tx.order.create({
          data: {
            orderNumber: generateOrderNumber(),
            userId: input.userId,
            businessId: input.businessId,
            cityId: input.cityId,
            addressId: input.addressId,
            fulfillmentType: input.fulfillmentType,
            status: "PLACED",
            subtotalPaise: input.subtotalPaise,
            taxPaise: input.taxPaise,
            deliveryFeePaise: input.deliveryFeePaise,
            platformFeePaise: input.platformFeePaise,
            discountPaise: input.discountPaise,
            totalPaise: input.totalPaise,
            paymentMethod: input.paymentMethod,
            paymentStatus: "PENDING",
            ...(input.couponId !== undefined ? { couponId: input.couponId } : {}),
            items: {
              create: input.items.map((i) => ({
                productVariantId: i.productVariantId,
                nameSnapshot: i.nameSnapshot,
                variantSnapshot: i.variantSnapshot,
                unitPriceSnapshotPaise: i.unitPriceSnapshotPaise,
                quantity: i.quantity,
                totalPaise: i.unitPriceSnapshotPaise * i.quantity,
              })),
            },
          },
          include: { items: true },
        });

        await tx.orderStatusHistory.create({
          data: { orderId: created.id, toStatus: "PLACED", changedBy: null, note: "Order placed" },
        });

        if (input.couponId && input.couponUserId) {
          await tx.couponRedemption.create({
            data: {
              couponId: input.couponId,
              userId: input.couponUserId,
              orderId: created.id,
              discountAppliedPaise: input.discountAppliedPaise ?? 0,
            },
          });
        }

        await tx.cart.update({ where: { id: input.cartId }, data: { status: "CONVERTED" } });

        return created;
      });

      return { success: true, order: this.toRecord(order) };
    } catch (err) {
      if (err instanceof StockReservationFailed) {
        return { success: false, unavailableVariantIds: err.unavailableVariantIds };
      }
      throw err;
    }
  }

  async findById(id: string): Promise<OrderRecord | null> {
    const order = await this.prisma.order.findUnique({ where: { id }, include: { items: true } });
    return order ? this.toRecord(order) : null;
  }

  async findByOrderNumber(orderNumber: string): Promise<OrderRecord | null> {
    const order = await this.prisma.order.findUnique({ where: { orderNumber }, include: { items: true } });
    return order ? this.toRecord(order) : null;
  }

  async listForUser(userId: string, cursor?: string, limit = 20): Promise<OrderRecord[]> {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: { items: true },
    });
    return orders.map((o) => this.toRecord(o));
  }

  async listForBusiness(businessId: string, status?: OrderStatus, cursor?: string, limit = 20): Promise<OrderRecord[]> {
    const orders = await this.prisma.order.findMany({
      where: { businessId, ...(status ? { status } : {}) },
      orderBy: { createdAt: "desc" },
      take: limit,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: { items: true },
    });
    return orders.map((o) => this.toRecord(o));
  }

  async transitionStatus(id: string, toStatus: OrderStatus, changedBy: string | null, note?: string): Promise<OrderRecord> {
    const current = await this.prisma.order.findUniqueOrThrow({ where: { id }, select: { status: true } });

    const [order] = await this.prisma.$transaction([
      this.prisma.order.update({
        where: { id },
        data: {
          status: toStatus,
          ...(toStatus === "ACCEPTED" ? { acceptedAt: new Date() } : {}),
          ...(toStatus === "DELIVERED" ? { deliveredAt: new Date() } : {}),
          ...(toStatus === "CANCELLED" ? { cancelledAt: new Date(), cancelReason: note ?? null } : {}),
        },
        include: { items: true },
      }),
      this.prisma.orderStatusHistory.create({
        data: { orderId: id, fromStatus: current.status, toStatus, changedBy, note: note ?? null },
      }),
    ]);
    return this.toRecord(order);
  }

  async setPaymentStatus(id: string, status: OrderPaymentStatus): Promise<OrderRecord> {
    const order = await this.prisma.order.update({ where: { id }, data: { paymentStatus: status }, include: { items: true } });
    return this.toRecord(order);
  }

  getStatusHistory(orderId: string): Promise<OrderStatusHistoryRecord[]> {
    return this.prisma.orderStatusHistory.findMany({
      where: { orderId },
      orderBy: { createdAt: "asc" },
      select: { fromStatus: true, toStatus: true, changedBy: true, note: true, createdAt: true },
    });
  }

  async restoreStock(orderId: string): Promise<void> {
    const order = await this.prisma.order.findUnique({ where: { id: orderId }, include: { items: true } });
    if (!order) throw new OrderNotFoundException();

    await this.prisma.$transaction(
      order.items
        .filter((item) => item.productVariantId)
        .map((item) =>
          this.prisma.productVariant.update({
            where: { id: item.productVariantId! },
            data: { stockQuantity: { increment: item.quantity } },
          }),
        ),
    );
  }

  private toRecord(order: OrderWithItems): OrderRecord {
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      userId: order.userId,
      businessId: order.businessId,
      cityId: order.cityId,
      addressId: order.addressId,
      fulfillmentType: order.fulfillmentType,
      status: order.status,
      subtotalPaise: order.subtotalPaise,
      taxPaise: order.taxPaise,
      deliveryFeePaise: order.deliveryFeePaise,
      platformFeePaise: order.platformFeePaise,
      discountPaise: order.discountPaise,
      totalPaise: order.totalPaise,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      couponId: order.couponId,
      cancelReason: order.cancelReason,
      placedAt: order.placedAt,
      items: order.items.map((i) => ({
        id: i.id,
        productVariantId: i.productVariantId,
        nameSnapshot: i.nameSnapshot,
        variantSnapshot: i.variantSnapshot,
        unitPriceSnapshotPaise: i.unitPriceSnapshotPaise,
        quantity: i.quantity,
        totalPaise: i.totalPaise,
      })),
    };
  }
}
