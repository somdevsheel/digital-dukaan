# @app/realtime

Socket.IO gateway — order status, delivery live-location, in-app chat. A standalone
Node/TypeScript process (**not NestJS**), pure event relay: it has no database access and
never talks to Postgres. See [Architecture §14](../../docs/02-architecture/ARCHITECTURE.md#14-realtime-architecture)
and [API Design §7](../../docs/04-api-design/API_DESIGN.md#7-realtime-events-non-rest).

## Status

Implemented (Phase 7). Boots, authenticates sockets against the same JWT apps/api issues,
runs the Redis adapter, authorizes room joins, throttles location pings, and relays events
— both directly between connected sockets and via a Redis Pub/Sub channel a future
apps/api change can publish into (see "API → Realtime wiring" below; **that publish side
does not exist yet** — verified by grepping apps/api's redis/commerce/delivery code for
any `.publish(` call; there is none).

## Running locally

```bash
cp apps/realtime/.env.example apps/realtime/.env
# edit JWT_ACCESS_SECRET to match apps/api's .env byte-for-byte — see "Auth" below
docker compose up -d redis   # or whatever REDIS_URL in .env points at
pnpm --filter @app/realtime dev
curl http://localhost:4001/healthz   # {"status":"ok"}
```

`.env` is loaded via `dotenv/config` at the top of `src/main.ts` (added as a dependency —
the scaffolded `dev`/`build`/`start` scripts don't pass `--env-file` and tsx doesn't
auto-load `.env`, so without this the process silently reads only inherited shell env).

## Auth

Every socket connection must present the identical JWT apps/api issues from
`POST /auth/login/email`, `/auth/otp/verify`, and `/auth/refresh`. Verified by reading
`apps/api/src/modules/identity/presentation/strategies/jwt.strategy.ts` and
`.../infrastructure/security/jwt-token-issuer.ts` directly (not assumed):

- **Secret**: `JWT_ACCESS_SECRET` — must be byte-identical to apps/api's env var of the
  same name (`common/config/configuration.ts` → `jwt.accessSecret`).
- **Algorithm**: HS256 — apps/api's `JwtTokenIssuer.issueAccessToken` calls
  `JwtService.signAsync` with a plain secret string and no `algorithm` option, which is
  jsonwebtoken's HS256 default. `src/auth.ts` pins `algorithms: ["HS256"]` explicitly on
  `jwt.verify` (defense against algorithm-confusion, independent of what apps/api does).
- **Payload**: `{ sub: string, grants: PermissionGrant[] }` where
  `PermissionGrant = { permission: string, businessId: string | null }` — identical to
  `apps/api/src/common/types/authenticated-user.ts`.

Token is read from `socket.handshake.auth.token` (idiomatic `io(url, { auth: { token } })`)
or an `Authorization: Bearer <token>` handshake header, whichever is present.

## Rooms and join authorization

Clients emit `join` with `{ room: "order:<id>" | "delivery:<id>" | "business:<id>" }` and
get back an ack `{ ok: boolean, room?: string, error?: string }`. `leave` works the same way.

| Room | Meaning | Join authorization |
|---|---|---|
| `business:{businessId}` | Merchant live order feed | **Cryptographic.** The JWT's `grants` array is the exact shape apps/api's `PermissionGuard` checks. A grant with `businessId === null` is a platform-wide admin (matches any business); a grant with `businessId === businessId` means the user holds *some* staff permission for that business. Either is sufficient. |
| `order:{orderId}` | Order status + delivery chat | **Capability-URL, not DB-verified.** Any holder of a valid, non-expired access token may join, provided they know the exact order UUID. |
| `delivery:{partnerId}` | Live location ping | Same capability-URL model as `order:{orderId}`. |

**Documented gap** (the docs say joins are "authorized against the same JWT used for
REST" but don't spell out the mechanics, and this service deliberately has no DB access —
see Architecture §14): `order:{id}` and `delivery:{id}` cannot be checked against actual
resource ownership without a database. Order/delivery-partner IDs are non-enumerable
UUIDs the REST API only ever hands to the customer/partner who owns that resource
(`GET /orders/:id/track`, `GET /delivery-partners/me`), so "knows the id" + "has a valid
platform login" is treated as adequate proof for a chat/location relay room — the same
trust model shareable Uber/Swiggy-style tracking links use. This service never carries
anything financially sensitive, so the blast radius of this gap is "a logged-in user could
snoop another user's order chat/location if they guessed or leaked the UUID," not funds or
PII beyond what tracking already exposes. A real fix (out of scope here) would have the API
mint a short-lived signed "room ticket" claim (`{ sub, room, exp: +60s }`) alongside the
tracking/offer response, which this service would verify instead of trusting bare identity
+ a guessed id. `business:{id}` didn't need this trade-off because business scoping already
lives inside the JWT grants — see `src/rooms.ts`'s `authorizeJoin` for the full comment.

## Event contract

### Client → server

| Event | Payload | Notes |
|---|---|---|
| `join` | `{ room: string }` | ack `{ ok, room?, error? }` |
| `leave` | `{ room: string }` | ack `{ ok: true }` |
| `chat.message` | `{ orderId: string, message: string }` | Sender must already be joined to `order:{orderId}` (join-authorization isn't bypassable via chat). Server stamps `senderId` (from the verified JWT) and `timestamp`, then relays. |
| `location.update` | `{ partnerId: string, orderId?: string, latitude: number, longitude: number }` | Server-side throttled to **1 per 5 seconds per `partnerId`** (Architecture §14) — extra pings within the window are silently dropped, not queued. `orderId` is optional; when present, the resulting broadcast also reaches that order's tracking room (the customer's active-delivery screen joins `order:{id}`, not `delivery:{id}`). |

### Server → client

| Event | Payload | Broadcast to |
|---|---|---|
| `order.status_changed` | `{ orderId, status, previousStatus, changedAt }` | `order:{orderId}` **and** `business:{businessId}` (task requirement beyond API Design §7's table — merchants watching their live queue need in-flight status changes too, not just new-order notifications) |
| `order.new` | `{ orderId, summary }` | `business:{businessId}` |
| `chat.message` | `{ orderId, senderId, message, timestamp }` | `order:{orderId}` |
| `location.updated` | `{ partnerId, orderId?, latitude, longitude, timestamp }` | `delivery:{partnerId}`, and also `order:{orderId}` when the ping carried one |

Payload field names deviate slightly from API Design §7's terse `{ lat, lng, timestamp }`
(spelled out as `latitude`/`longitude` here, matching `DeliveryPartner.currentLatitude` /
`currentLongitude` in prisma/schema.prisma) and add `previousStatus` to
`order.status_changed` to mirror `OrderStatusHistory.fromStatus` — both are additive/renaming
deviations, not breaking ones, and are called out here for whoever wires up client apps.

## API → Realtime wiring (what's done vs. what apps/api still needs)

Two options were on the table: an internal HTTP endpoint apps/api calls, or apps/api
publishing into Redis channels this service subscribes to. **Chosen: Redis Pub/Sub** —
both services already share one Redis instance per the Architecture C4 diagram
(`API → Redis`, `RT → Redis`, §3), so this adds no new network surface and no
shared-secret HTTP endpoint to secure/rotate, and it matches the event-driven pattern this
codebase already uses for BullMQ (§13) instead of inventing a second RPC style.

This service subscribes to (see `src/event-source.ts`):

| Channel | JSON payload | Triggers |
|---|---|---|
| `events:order-status` | `{ orderId, businessId, status, previousStatus, changedAt }` | broadcasts `order.status_changed` to `order:{orderId}` and `business:{businessId}` |
| `events:order-new` | `{ orderId, businessId, summary }` | broadcasts `order.new` to `business:{businessId}` |
| `events:delivery-location` | `{ partnerId, orderId?, latitude, longitude, timestamp }` | broadcasts `location.updated` — a secondary path to the same broadcast the direct socket `location.update` ping uses, for a REST-only caller with no open socket. **Not throttled on this side** — a publisher here is trusted to already rate-limit itself. |

**Nothing in apps/api publishes to these channels yet.** Wiring `redis.publish(...)` calls
into apps/api's `OrderStatusUseCase` (both customer-cancel and merchant-transition paths)
and wherever "order placed" is decided is explicitly out of scope for this task — this
subscriber is fully implemented and was verified against manually published test messages
(`redis-cli PUBLISH events:order-status '{"orderId":"...", ...}'` → connected, joined
clients receive `order.status_changed`), not just typechecked.

## Location throttle

`src/throttle.ts`'s `KeyedThrottle` is a fixed-window limiter keyed by the **claimed**
`partnerId` from the ping payload (not `socket.id` — the requirement is "per delivery
partner," and partnerId isn't cryptographically verifiable here for the same no-DB-access
reason as room joins; see `rooms.ts`). Stale keys are swept periodically so the map doesn't
grow unbounded across a long-running process.

## Redis usage

Three separate ioredis connections (`src/redis.ts`), deliberately not shared — a connection
in Redis SUBSCRIBE mode can only run pub/sub commands:

- `pubClient` / `subClient` — handed to `@socket.io/redis-adapter`. **Mandatory from MVP**
  per Architecture §14: without it, an event emitted from one pod never reaches a client
  connected to another pod once this service scales past one replica.
- `eventsSubClient` — this service's own subscription to the `events:*` channels above.

## Verification performed

- `pnpm --filter @app/realtime typecheck` and `lint` — clean.
- `pnpm --filter @app/realtime build` — produces `dist/`, then `node dist/main.js` boots
  identically to `dev` against a real Redis (docker-compose Redis on `localhost:6380` in
  this dev environment).
- Manual end-to-end run (throwaway `socket.io-client` script, not committed) against a live
  instance covering: valid JWT connects; malformed/wrong-secret/missing tokens rejected;
  `business:{id}` join granted/denied correctly per JWT grants (including the
  `businessId: null` admin catch-all); `order:{id}` join allowed for any authenticated user;
  malformed room names rejected; `chat.message` relayed only to sockets that had actually
  joined the room; `location.update` throttled to exactly one broadcast across three pings
  sent within a 5s window; a **second instance on a different port**, same Redis, proving a
  `chat.message` sent by a client connected to instance A was received by a client connected
  only to instance B — i.e. the Redis adapter's cross-pod relay actually works, not just
  "adapter attached" in a log line; and `redis-cli`-style `PUBLISH` on `events:order-status`
  reaching both the `order:{id}` and `business:{id}` rooms.
