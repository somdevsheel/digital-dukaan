import { broadcastLocationUpdated } from "./broadcast";
import type { AppServer, AppSocket, ChatMessagePayload, LocationUpdatedPayload } from "./events";
import { ClientEvents, ServerEvents } from "./events";
import { logger } from "./logger";
import { authorizeJoin, parseRoom } from "./rooms";
import { KeyedThrottle } from "./throttle";

// Architecture §14: "Location pings are throttled (e.g., max 1 per 5s per rider)."
const LOCATION_THROTTLE_MS = 5000;
const locationThrottle = new KeyedThrottle(LOCATION_THROTTLE_MS);

type Ack = (response: { ok: boolean; room?: string; error?: string }) => void;

function readRoomPayload(payload: unknown): string | null {
  if (typeof payload !== "object" || payload === null) return null;
  const room = (payload as Record<string, unknown>).room;
  return typeof room === "string" ? room : null;
}

export function registerConnectionHandlers(io: AppServer, socket: AppSocket): void {
  const userId = socket.data.userId;
  logger.info({ userId, socketId: socket.id }, "socket connected");

  socket.on(ClientEvents.Join, (payload: unknown, ack?: Ack) => {
    const room = readRoomPayload(payload);
    if (!room) {
      ack?.({ ok: false, error: "room is required" });
      return;
    }
    const parsed = parseRoom(room);
    if (!parsed) {
      ack?.({ ok: false, error: "unrecognized room format" });
      return;
    }
    if (!authorizeJoin(parsed, socket.data.grants)) {
      logger.warn({ userId, room }, "join denied");
      ack?.({ ok: false, error: "forbidden" });
      return;
    }
    void socket.join(room);
    logger.info({ userId, room }, "socket joined room");
    ack?.({ ok: true, room });
  });

  socket.on(ClientEvents.Leave, (payload: unknown, ack?: Ack) => {
    const room = readRoomPayload(payload);
    if (room) {
      void socket.leave(room);
    }
    ack?.({ ok: true });
  });

  // Relayed chat, scoped to order:{orderId} — sender must already have joined (and thus
  // been authorized for) that room; this isn't a side channel around join-authorization.
  socket.on(ClientEvents.ChatMessage, (payload: unknown) => {
    const body = payload as Record<string, unknown> | null;
    const orderId = body && typeof body.orderId === "string" ? body.orderId : null;
    const rawMessage = body && typeof body.message === "string" ? body.message.trim() : null;
    if (!orderId || !rawMessage) return;

    const room = `order:${orderId}`;
    if (!socket.rooms.has(room)) {
      logger.warn({ userId, orderId }, "chat.message rejected: socket not joined to order room");
      return;
    }

    const chatPayload: ChatMessagePayload = {
      orderId,
      senderId: userId,
      message: rawMessage,
      timestamp: new Date().toISOString(),
    };
    io.to(room).emit(ServerEvents.ChatMessage, chatPayload);
  });

  // Direct delivery-partner location ping — the low-latency path (vs. the Redis
  // event-source relay in event-source.ts, which exists for non-socket callers). Server-side
  // throttled per Architecture §14: the client is never trusted to self-limit.
  socket.on(ClientEvents.LocationUpdate, (payload: unknown) => {
    const body = payload as Record<string, unknown> | null;
    const partnerId = body && typeof body.partnerId === "string" ? body.partnerId : null;
    const orderId = body && typeof body.orderId === "string" ? body.orderId : undefined;
    const latitude = body?.latitude;
    const longitude = body?.longitude;

    if (
      !partnerId ||
      typeof latitude !== "number" ||
      typeof longitude !== "number" ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude) ||
      Math.abs(latitude) > 90 ||
      Math.abs(longitude) > 180
    ) {
      return;
    }

    if (!locationThrottle.allow(partnerId)) {
      return; // silently dropped — see throttle.ts
    }

    const timestamp = new Date().toISOString();
    const locationPayload: LocationUpdatedPayload = orderId
      ? { partnerId, orderId, latitude, longitude, timestamp }
      : { partnerId, latitude, longitude, timestamp };
    broadcastLocationUpdated(io, locationPayload);
  });

  socket.on("disconnect", (reason: string) => {
    logger.info({ userId, socketId: socket.id, reason }, "socket disconnected");
  });
}
