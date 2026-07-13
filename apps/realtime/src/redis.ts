import Redis from "ioredis";
import { env } from "./env";
import { logger } from "./logger";

function attachLogging(client: Redis, role: string): Redis {
  client.on("error", (err) => logger.error({ err: err.message, role }, "redis client error"));
  client.on("connect", () => logger.info({ role }, "redis client connected"));
  return client;
}

export interface RedisClients {
  /** Handed to @socket.io/redis-adapter — publishes broadcast packets. Architecture §14: mandatory from MVP. */
  pubClient: Redis;
  /** Handed to @socket.io/redis-adapter — receives broadcast packets. Put into SUBSCRIBE mode internally by the adapter. */
  subClient: Redis;
  /** This service's own subscription to the events:* channels — see event-source.ts and README. */
  eventsSubClient: Redis;
}

/**
 * Three separate connections, deliberately not shared: an ioredis connection that's been
 * put into Redis SUBSCRIBE mode can only run pub/sub commands (ioredis's own constraint),
 * so the adapter's subClient and this service's own event-source subscriber each need a
 * dedicated connection — reusing one would break the other.
 */
export function createRedisClients(): RedisClients {
  const pubClient = attachLogging(new Redis(env.redisUrl), "adapter-pub");
  const subClient = attachLogging(pubClient.duplicate(), "adapter-sub");
  const eventsSubClient = attachLogging(pubClient.duplicate(), "events-sub");
  return { pubClient, subClient, eventsSubClient };
}
