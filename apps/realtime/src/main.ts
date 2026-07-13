import { createServer } from "node:http";
import { createAdapter } from "@socket.io/redis-adapter";
import "dotenv/config"; // must run before ./env is imported, so process.env is populated from .env first
import { Server } from "socket.io";
import { socketAuthMiddleware } from "./auth";
import { attachEventSource } from "./event-source";
import { env } from "./env";
import type { AppServer } from "./events";
import { registerConnectionHandlers } from "./gateway";
import { logger } from "./logger";
import { createRedisClients } from "./redis";
import type Redis from "ioredis";

function waitReady(client: Redis): Promise<void> {
  if (client.status === "ready") return Promise.resolve();
  return new Promise((resolve) => client.once("ready", () => resolve()));
}

async function bootstrap(): Promise<void> {
  const httpServer = createServer((req, res) => {
    if (req.url === "/healthz") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(JSON.stringify({ status: "ok" }));
      return;
    }
    res.writeHead(404);
    res.end();
  });

  // No cookies involved (auth is a bearer token in the socket.io handshake `auth`
  // payload/Authorization header, not a cookie), so a wildcard CORS origin carries none of
  // the CSRF-via-CORS risk it would for cookie-authenticated endpoints.
  const io: AppServer = new Server(httpServer, {
    cors: { origin: "*" },
  });

  const { pubClient, subClient, eventsSubClient } = createRedisClients();
  await Promise.all([waitReady(pubClient), waitReady(subClient), waitReady(eventsSubClient)]);

  // Redis adapter — mandatory from MVP per Architecture §14: without it, an event emitted
  // from one pod never reaches a client connected to another pod.
  io.adapter(createAdapter(pubClient, subClient));
  logger.info("redis adapter attached");

  attachEventSource(io, eventsSubClient);

  io.use(socketAuthMiddleware);
  io.on("connection", (socket) => registerConnectionHandlers(io, socket));

  httpServer.listen(env.port, () => {
    logger.info({ port: env.port, nodeEnv: env.nodeEnv }, "@app/realtime listening");
  });

  let shuttingDown = false;
  const shutdown = async (signal: string): Promise<void> => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info({ signal }, "shutting down");
    await io.close();
    await Promise.allSettled([pubClient.quit(), subClient.quit(), eventsSubClient.quit()]);
    process.exit(0);
  };
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));
}

bootstrap().catch((err: unknown) => {
  logger.error({ err: (err as Error).message }, "fatal boot error");
  process.exit(1);
});
