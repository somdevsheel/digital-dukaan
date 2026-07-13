import pino from "pino";
import { env } from "./env";

// Structured JSON logs, per Architecture §16 ("Logging: structured JSON (pino)"). No
// pino-pretty transport — it isn't a declared dependency of this app, and JSON-per-line
// is what the observability stack (§16) expects to ingest anyway.
export const logger = pino({
  level: env.logLevel,
  base: { service: "realtime" },
});
