import { Inject, Injectable } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { ORDER_REPOSITORY, type OrderRecord, type OrderRepository, type OrderStatus } from "../../domain/repositories/order.repository";
import { InitiateRefundUseCase } from "../../../payments/application/use-cases/initiate-refund.use-case";
import { ForbiddenException } from "../../../../common/errors/app.errors";
import { IllegalOrderTransitionException, OrderNotCancellableException, OrderNotFoundException } from "../../domain/errors/commerce.errors";

// The order state machine, independent of who's allowed to trigger each edge (that's
// enforced separately: PermissionGuard for merchant transitions, ownership check for
// customer cancellation). Database Design's OrderStatus enum lists every node; this is
// the one place their legal edges are defined.
const LEGAL_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PLACED: ["ACCEPTED", "REJECTED", "CANCELLED"],
  ACCEPTED: ["PACKING", "CANCELLED"],
  PACKING: ["READY", "CANCELLED"],
  READY: ["OUT_FOR_DELIVERY", "COMPLETED", "CANCELLED"],
  OUT_FOR_DELIVERY: ["DELIVERED"],
  DELIVERED: ["COMPLETED"],
  REJECTED: [],
  CANCELLED: [],
  COMPLETED: [],
};

const CANCELLABLE_STATUSES: OrderStatus[] = ["PLACED", "ACCEPTED", "PACKING"];

@Injectable()
export class OrderStatusUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY) private readonly orders: OrderRepository,
    private readonly initiateRefund: InitiateRefundUseCase,
    private readonly events: EventEmitter2,
  ) {}

  /** Merchant-initiated transition (Order Queue: accept/reject/packing/ready/out-for-delivery/complete). */
  async merchantTransition(businessId: string, orderId: string, toStatus: OrderStatus, adminUserId: string, note?: string): Promise<OrderRecord> {
    const order = await this.getOwnedOrThrow(orderId, businessId);
    this.assertLegalTransition(order.status, toStatus);

    const updated = await this.orders.transitionStatus(orderId, toStatus, adminUserId, note);

    if (toStatus === "CANCELLED") {
      await this.orders.restoreStock(orderId);
      await this.initiateRefund.execute(orderId, order.totalPaise);
    }

    this.events.emit("order.status_changed", { orderId, userId: order.userId, businessId: order.businessId, status: toStatus });
    return updated;
  }

  /**
   * Called by the Delivery module's OTP-verified completion handler — a distinct entry
   * point from `merchantTransition` (not because the state-machine logic differs, but
   * because the actor and permission model do: this is triggered by a delivery partner's
   * OTP handoff, not a merchant's dashboard action, and Delivery module has no reason to
   * depend on merchant permission scoping to call it).
   */
  async markDeliveredByPartner(orderId: string, deliveryPartnerUserId: string): Promise<OrderRecord> {
    const order = await this.orders.findById(orderId);
    if (!order) throw new OrderNotFoundException();
    this.assertLegalTransition(order.status, "DELIVERED");

    const updated = await this.orders.transitionStatus(orderId, "DELIVERED", deliveryPartnerUserId);
    this.events.emit("order.status_changed", { orderId, userId: order.userId, businessId: order.businessId, status: "DELIVERED" });
    return updated;
  }

  /** Same rationale as markDeliveredByPartner, for the pickup moment (READY -> OUT_FOR_DELIVERY). */
  async markOutForDeliveryByPartner(orderId: string, deliveryPartnerUserId: string): Promise<OrderRecord> {
    const order = await this.orders.findById(orderId);
    if (!order) throw new OrderNotFoundException();
    this.assertLegalTransition(order.status, "OUT_FOR_DELIVERY");

    const updated = await this.orders.transitionStatus(orderId, "OUT_FOR_DELIVERY", deliveryPartnerUserId);
    this.events.emit("order.status_changed", { orderId, userId: order.userId, businessId: order.businessId, status: "OUT_FOR_DELIVERY" });
    return updated;
  }

  /** Customer-initiated cancellation — same state machine, narrower set of allowed source states (API Design §8.1). */
  async cancelByCustomer(userId: string, orderId: string, reason: string): Promise<OrderRecord> {
    const order = await this.orders.findById(orderId);
    if (!order) throw new OrderNotFoundException();
    if (order.userId !== userId) throw new ForbiddenException();
    if (!CANCELLABLE_STATUSES.includes(order.status)) {
      throw new OrderNotCancellableException();
    }

    const updated = await this.orders.transitionStatus(orderId, "CANCELLED", userId, reason);
    await this.orders.restoreStock(orderId);
    await this.initiateRefund.execute(orderId, order.totalPaise);

    this.events.emit("order.status_changed", { orderId, userId: order.userId, businessId: order.businessId, status: "CANCELLED" });
    return updated;
  }

  private assertLegalTransition(from: OrderStatus, to: OrderStatus): void {
    if (!LEGAL_TRANSITIONS[from].includes(to)) {
      throw new IllegalOrderTransitionException(from, to);
    }
  }

  private async getOwnedOrThrow(orderId: string, businessId: string): Promise<OrderRecord> {
    const order = await this.orders.findById(orderId);
    if (!order) throw new OrderNotFoundException();
    if (order.businessId !== businessId) throw new ForbiddenException();
    return order;
  }
}
