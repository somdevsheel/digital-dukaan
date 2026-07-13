import type { AppServer, LocationUpdatedPayload, OrderNewPayload, OrderStatusChangedPayload } from "./events";
import { ServerEvents } from "./events";
import { businessRoom, deliveryRoom, orderRoom } from "./rooms";

/**
 * Broadcast a status change to both the order room (customer + merchant chat/tracking
 * screen) AND the business room (merchant live order queue) — task requirement beyond the
 * API Design §7 table, which only lists `order:{orderId}` for this event; merchants
 * watching their live order queue also need in-flight status changes, not just new-order
 * notifications.
 */
export function broadcastOrderStatusChanged(io: AppServer, payload: OrderStatusChangedPayload): void {
  const clientPayload = {
    orderId: payload.orderId,
    status: payload.status,
    previousStatus: payload.previousStatus,
    changedAt: payload.changedAt,
  };
  io.to(orderRoom(payload.orderId)).emit(ServerEvents.OrderStatusChanged, clientPayload);
  io.to(businessRoom(payload.businessId)).emit(ServerEvents.OrderStatusChanged, clientPayload);
}

/** API Design §7: business:{businessId} / order.new / { orderId, summary } — merchant live feed. */
export function broadcastOrderNew(io: AppServer, payload: OrderNewPayload): void {
  io.to(businessRoom(payload.businessId)).emit(ServerEvents.OrderNew, {
    orderId: payload.orderId,
    summary: payload.summary,
  });
}

/**
 * Broadcasts to delivery:{partnerId} always, and additionally to order:{orderId} when the
 * caller supplied one — the customer's active-delivery tracking screen (wireframe plate
 * 16) joins the order room, not the delivery-partner room, so location pings need to reach
 * both (task requirement; API Design §7 only lists the delivery:{partnerId} row).
 */
export function broadcastLocationUpdated(io: AppServer, payload: LocationUpdatedPayload): void {
  const clientPayload: LocationUpdatedPayload = payload.orderId
    ? {
        partnerId: payload.partnerId,
        orderId: payload.orderId,
        latitude: payload.latitude,
        longitude: payload.longitude,
        timestamp: payload.timestamp,
      }
    : {
        partnerId: payload.partnerId,
        latitude: payload.latitude,
        longitude: payload.longitude,
        timestamp: payload.timestamp,
      };

  io.to(deliveryRoom(payload.partnerId)).emit(ServerEvents.LocationUpdated, clientPayload);
  if (payload.orderId) {
    io.to(orderRoom(payload.orderId)).emit(ServerEvents.LocationUpdated, clientPayload);
  }
}
