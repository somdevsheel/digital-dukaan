import type { DefaultEventsMap, Server, Socket } from "socket.io";

// ---------------------------------------------------------------------------------------
// JWT claim shapes — kept as plain local interfaces (not imported from apps/api, which is
// a separate deployable with its own Prisma/Nest dependency graph this service must not
// pull in). Shape verified against apps/api/src/modules/identity/presentation/strategies/
// jwt.strategy.ts and .../infrastructure/security/jwt-token-issuer.ts:
// JwtTokenIssuer signs `{ sub: userId, grants }` with JWT_ACCESS_SECRET, HS256 (no
// `algorithm` option passed to jsonwebtoken -> library default), no separate realtime
// audience/issuer claim.
// ---------------------------------------------------------------------------------------

/** Identical shape/semantics to apps/api's PermissionGrant (common/types/authenticated-user.ts). */
export interface PermissionGrant {
  permission: string;
  /** null = platform-wide grant (admin); otherwise scoped to one business. */
  businessId: string | null;
}

/** What socket.data holds after socketAuthMiddleware runs — see auth.ts. */
export interface SocketAuthData {
  userId: string;
  grants: PermissionGrant[];
}

export type AppServer = Server<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, SocketAuthData>;
export type AppSocket = Socket<DefaultEventsMap, DefaultEventsMap, DefaultEventsMap, SocketAuthData>;

// ---------------------------------------------------------------------------------------
// Client <-> server event names
// ---------------------------------------------------------------------------------------

export const ClientEvents = {
  /** { room: string } -> ack { ok: boolean; room?: string; error?: string } */
  Join: "join",
  /** { room: string } -> ack { ok: true } */
  Leave: "leave",
  /** { orderId: string; message: string } — sender must already be joined to order:{orderId} */
  ChatMessage: "chat.message",
  /** { partnerId: string; orderId?: string; latitude: number; longitude: number } — throttled 1/5s per partnerId */
  LocationUpdate: "location.update",
} as const;

export const ServerEvents = {
  /** API Design §7 — { orderId, status, previousStatus, changedAt } */
  OrderStatusChanged: "order.status_changed",
  /** API Design §7 — { orderId, summary } */
  OrderNew: "order.new",
  /** API Design §7 — { orderId, senderId, message, timestamp } */
  ChatMessage: "chat.message",
  /** API Design §7 — { partnerId, orderId?, latitude, longitude, timestamp } */
  LocationUpdated: "location.updated",
} as const;

// ---------------------------------------------------------------------------------------
// Redis Pub/Sub channels — the api -> realtime event-source mechanism (see README for
// what's wired vs. what a future apps/api change needs to publish).
// ---------------------------------------------------------------------------------------

export const EventChannels = {
  OrderStatusChanged: "events:order-status",
  OrderNew: "events:order-new",
  LocationUpdated: "events:delivery-location",
} as const;

// ---------------------------------------------------------------------------------------
// Broadcast payload shapes
// ---------------------------------------------------------------------------------------

/** Mirrors OrderStatusHistory (prisma/schema.prisma): fromStatus/toStatus/createdAt -> previousStatus/status/changedAt. */
export interface OrderStatusChangedPayload {
  orderId: string;
  /** carried for routing to business:{businessId} only — not necessarily meaningful to clients beyond that */
  businessId: string;
  status: string;
  previousStatus: string | null;
  changedAt: string;
}

export interface OrderNewPayload {
  orderId: string;
  businessId: string;
  /** shape owned by whatever apps/api decides is useful for the merchant live feed row — not this service's concern */
  summary: Record<string, unknown>;
}

export interface ChatMessagePayload {
  orderId: string;
  senderId: string;
  message: string;
  timestamp: string;
}

export interface LocationUpdatedPayload {
  partnerId: string;
  orderId?: string;
  latitude: number;
  longitude: number;
  timestamp: string;
}
