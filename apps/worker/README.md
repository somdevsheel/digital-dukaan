# @app/worker

BullMQ consumers, deployed as a separate replica set from `@app/api` so queue-depth-driven scaling never competes with request-latency-driven API scaling ([Architecture §3](../../docs/02-architecture/ARCHITECTURE.md#3-service-decomposition--deployment-topology)).

## Status

**Implemented:**
- `notifications` queue — `NotificationsProcessor` renders a seeded `NotificationTemplate` and sends via a `ChannelSenderPort` (PUSH/EMAIL/SMS). Ships with console-logging sender implementations (`channels/console-channel-senders.ts`) — genuinely functional (nothing silently dropped, nothing half-built), just not wired to real Firebase/Resend/an SMS provider yet. Swapping those in is a provider-adapter change behind the same port, not a rewrite.
- `maintenance` queue — `StaleOrderCleanupProcessor`, a repeatable job (registered on boot in `app.module.ts`) auto-cancelling orders a merchant never actioned within the timeout window, restoring reserved stock.

**Deliberately not built this pass** (see [Architecture §11](../../docs/02-architecture/ARCHITECTURE.md#11-search--discovery-architecture) and [Business module's `BusinessSearchPort`](../api/src/modules/business/domain/services/business-search.port.ts)):
- **`search-index`** — discovery search runs against Postgres/PostGIS directly right now (`PostgresBusinessSearchAdapter`), which needs no index to stay fresh. Building an event→queue→Meilisearch pipeline with no Meilisearch adapter on the other end would be scaffolding with nothing to do — add this queue/consumer only alongside the Meilisearch adapter itself.
- **`payout-settlement` / `cod-reconciliation`** — Razorpay Route linked-account automation ([Architecture §10](../../docs/02-architecture/ARCHITECTURE.md#10-payments-architecture)) is a real integration project of its own; `MerchantPayoutBatch`/`CashCollection` remittance tracking exist in the schema but aren't automated yet.
- **`report-rollup`** — merchant/admin dashboard materialized-view refresh ([Database Design §4.6](../../docs/03-database-design/DATABASE_DESIGN.md#46-analytics-is-materialized-views-not-tables)).
- **`image-processing`** — thumbnail/variant generation on upload.

## Structure

```
src/
  channels/            # ChannelSenderPort + console-log implementations
  config/
  prisma/              # own PrismaService — see prisma/schema.prisma's header on the schema duplication
  processors/
    notifications.processor.ts
    stale-order-cleanup.processor.ts
  app.module.ts
  main.ts
```

## Local development

```bash
pnpm infra:up
cp .env.example .env
pnpm --filter @app/worker prisma:generate
pnpm --filter @app/worker dev
```
