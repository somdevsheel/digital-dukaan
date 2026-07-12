import { Inject, Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { DELIVERY_REPOSITORY, type DeliveryRepository } from "../../domain/repositories/delivery.repository";
import { ORDER_REPOSITORY, type OrderRepository } from "../../../commerce/domain/repositories/order.repository";

/**
 * Creates the (initially UNASSIGNED) Delivery record the moment an order is placed, for
 * DELIVERY-fulfillment orders only — pickup orders never enter this module at all. Reads
 * the order back via Commerce's exported ORDER_REPOSITORY rather than requiring the event
 * payload to carry fulfillmentType, consistent with how NotificationListener resolves
 * details it needs from an already-exported repository instead of an ever-growing event shape.
 */
@Injectable()
export class DeliveryCreationListener {
  constructor(
    @Inject(DELIVERY_REPOSITORY) private readonly deliveries: DeliveryRepository,
    @Inject(ORDER_REPOSITORY) private readonly orders: OrderRepository,
  ) {}

  @OnEvent("order.placed")
  async onOrderPlaced(payload: { orderId: string }): Promise<void> {
    const order = await this.orders.findById(payload.orderId);
    if (!order || order.fulfillmentType !== "DELIVERY") return;

    await this.deliveries.createForOrder(order.id);
  }
}
