import type Redis from "ioredis";
import type { AppServer, LocationUpdatedPayload, OrderNewPayload, OrderStatusChangedPayload } from "./events";
import { EventChannels } from "./events";
import { broadcastLocationUpdated, broadcastOrderNew, broadcastOrderStatusChanged } from "./broadcast";
import { logger } from "./logger";

/**
 * The api -> realtime event-source mechanism (task-required; the docs don't fully specify
 * this wiring). Chosen approach: apps/realtime subscribes to plain Redis Pub/Sub channels
 * that a future apps/api change would PUBLISH into — over an internal HTTP endpoint —
 * because both services already share one Redis instance per the Architecture C4 diagram
 * ("API -> Redis", "RT -> Redis", §3), so this adds zero new network surface, no
 * shared-secret HTTP endpoint to secure/rotate, and it matches the event-driven pattern
 * this codebase already uses for BullMQ (§13) rather than inventing a second RPC style.
 *
 * IMPORTANT — what is and isn't wired: this subscriber is fully implemented and correct on
 * the realtime side (verified against manually published test messages, see README). But
 * `apps/api` does NOT publish to any of these channels yet — verified by grepping
 * apps/api/src/common/redis and the commerce/delivery modules for any `.publish(` call at
 * the time of writing; there is none. Wiring the publish side into apps/api's
 * OrderStatusUseCase (merchant + customer transitions) and wherever "new order placed" is
 * decided is explicitly out of scope for this task. See README for the exact channel
 * names and JSON payload shapes a future change would need to publish.
 */
export function attachEventSource(io: AppServer, subscriber: Redis): void {
  const channels = Object.values(EventChannels);

  subscriber.on("message", (channel: string, raw: string) => {
    try {
      const data: unknown = JSON.parse(raw);
      switch (channel) {
        case EventChannels.OrderStatusChanged:
          broadcastOrderStatusChanged(io, data as OrderStatusChangedPayload);
          break;
        case EventChannels.OrderNew:
          broadcastOrderNew(io, data as OrderNewPayload);
          break;
        case EventChannels.LocationUpdated:
          // Secondary path to the same broadcast the direct socket `location.update` ping
          // uses (gateway.ts) — e.g. for a REST-only fallback client with no open socket.
          // Deliberately NOT throttled here: that's this service's own concern for
          // client-originated pings; a publisher on this channel is trusted to already
          // rate-limit itself before publishing.
          broadcastLocationUpdated(io, data as LocationUpdatedPayload);
          break;
        default:
          logger.warn({ channel }, "message received on unhandled channel");
      }
    } catch (err) {
      logger.error({ err: (err as Error).message, channel, raw }, "failed to process event-source message");
    }
  });

  subscriber.subscribe(...channels).then(
    () => logger.info({ channels }, "subscribed to event-source channels"),
    (err: Error) => logger.error({ err: err.message }, "failed to subscribe to event-source channels"),
  );
}
