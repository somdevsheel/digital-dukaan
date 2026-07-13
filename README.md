# Hyperlocal Digital Marketplace Platform

**Working title.** Final product name TBD (see [PRD §16](docs/01-product-requirements/PRD.md#16-open-decisions-requiring-stakeholder-input)).

Built by **Arutech Consultancy Services LLP** — a platform giving every local business (grocery, medical, restaurants, salons, clinics, consultants, and more) its own digital showroom, discoverable and transactable by nearby customers.

## Delivery Phases

This project is being executed in gated phases. Each phase must be reviewed and approved before the next begins.

| # | Phase | Status | Doc |
|---|-------|--------|-----|
| 1 | Product Requirements | ✅ Approved | [docs/01-product-requirements/PRD.md](docs/01-product-requirements/PRD.md) |
| 2 | System Architecture | ✅ Draft ready for review | [docs/02-architecture/ARCHITECTURE.md](docs/02-architecture/ARCHITECTURE.md) |
| 3 | Database Design | ✅ Draft ready for review | [docs/03-database-design/](docs/03-database-design/) |
| 4 | API Design | ✅ Draft ready for review | [docs/04-api-design/API_DESIGN.md](docs/04-api-design/API_DESIGN.md) |
| 5 | UI Wireframes | ✅ Draft ready for review | [docs/05-ui-wireframes/](docs/05-ui-wireframes/) |
| 6 | Folder Structure | ✅ Scaffolded | [docs/06-folder-structure/FOLDER_STRUCTURE.md](docs/06-folder-structure/FOLDER_STRUCTURE.md) |
| 7 | Backend Development | ✅ Complete — 9 domain modules + worker + realtime gateway, verified end-to-end (migrations, seed, real API calls, live socket connections) | [apps/api](apps/api), [apps/worker](apps/worker), [apps/realtime](apps/realtime) |
| 8 | Frontend Development | ✅ Complete — all 5 client apps built (Merchant Dashboard, Admin Panel, Public Web, Customer app, Delivery Partner app) | [apps/web-merchant](apps/web-merchant), [apps/web-admin](apps/web-admin), [apps/web-public](apps/web-public), [apps/mobile-customer](apps/mobile-customer), [apps/mobile-delivery](apps/mobile-delivery) |
| 9 | Testing | ✅ `apps/api`: 55 tests (7 unit suites + 2 integration suites), clean typecheck + lint across all 8 apps | [apps/api/src/**/*.spec.ts](apps/api), [apps/api/test/](apps/api/test) |
| 10 | Deployment | ⏳ Not started | — |

## Repo Layout

```
docs/
  01-product-requirements/   Phase 1 deliverables
  02-architecture/           Phase 2 deliverables
  03-database-design/        Phase 3 deliverables (DATABASE_DESIGN.md + schema.prisma)
  04-api-design/              Phase 4 deliverables
  05-ui-wireframes/            Phase 5 deliverables (WIREFRAMES.md + wireframe-gallery.html)
  06-folder-structure/          Phase 6 deliverable (FOLDER_STRUCTURE.md)
apps/            8 deployable units — see docs/06-folder-structure/FOLDER_STRUCTURE.md
packages/        6 shared libraries
docker-compose.yml   Local dev infra (Postgres+PostGIS, Redis, Meilisearch, MinIO)
```

Implementation (`apps/*/src`, `packages/*/src`) begins Phase 7.

## Frontend Progress (Phase 8)

All 5 client apps cover their full wireframe plate range as working vertical slices — MVP-scoped, not the fully polished wireframe fidelity (see gaps noted per feature below).

### Merchant Dashboard (plates 08–11)

- Auth: login, in-memory access token + httpOnly refresh cookie, silent refresh on load, route guard.
- Dashboard shell: top bar, sign-out, protected `(dashboard)` route group; business-scoped pages share a `Products | Orders | Sales | Coupons | Staff` tab layout.
- Store registration: `/businesses/new` — creates a business via `POST /merchant/businesses`; the dashboard home page lists the merchant's businesses (linking into each) or shows this as an empty-state CTA.
- Catalog (MVP): `/businesses/[id]/products` — category sidebar (flat, add-only) and a product table with an "Add Product" dialog (name, category, price, stock; creates a single default variant). Not yet built: variant editing, product images, CSV import, category editing/reordering — see [wireframe plate 09](docs/05-ui-wireframes/wireframe-gallery.html#s09).
- Order queue: `/businesses/[id]/orders` — Kanban board (New → Accepted → Packing → Ready → Out for Delivery) with Accept/Reject and stage-advance actions, using the shared `StatusStepper`. Fulfillment-aware: pickup orders resolve to a merchant-marked "Complete" instead of a delivery handoff. Auto-refreshes every 15s; not yet built: sound/vibration escalation for unacknowledged orders (per [plate 10](docs/05-ui-wireframes/wireframe-gallery.html#s10)).
- Sales dashboard: `/businesses/[id]/sales` — Today/Week/Month stat tiles (revenue, orders, new customers, AOV) plus a 7-day revenue trend chart, per [plate 11](docs/05-ui-wireframes/wireframe-gallery.html#s11). Backed by a new `business_sales_daily_mv` materialized view (Database Design §4.6) refreshed every 15 min by the Worker's `report-rollup` job — **this endpoint and its backing view/job didn't exist before this pass** (`GET /merchant/businesses/:id/analytics/sales` was documented in API Design but never implemented).
- Coupons: `/businesses/[id]/coupons` — create (code, percent/flat, min order, validity window) and activate/deactivate. **Full CRUD backend added this pass** — only customer-facing coupon *validation* existed before (`POST /carts/:businessId/apply-coupon`); merchant-side create/list/update (`CRUD /merchant/businesses/:id/coupons`, per API Design) had never been implemented.
- Staff: `/businesses/[id]/staff` — invite by email (owner/staff role), list, remove. Backend already existed; this pass only added the frontend.

### Admin Panel (plates 12–14)

Built from scratch this pass — was pure scaffolding (4 files, no source) before. Distinct indigo accent from the Merchant Dashboard's teal so an operator switching apps has an immediate visual cue.

- Auth + shell: same pattern as web-merchant (login, silent refresh, route guard); top nav for `Verification | Businesses | Overview` instead of business-scoped tabs, since admin isn't scoped to "my businesses."
- Verification queue: `/` — Pending/Approved/Rejected tabs, Approve (one click) / Reject (reason required, dialog) per [plate 12](docs/05-ui-wireframes/wireframe-gallery.html#s12). Every decision writes an `AuditLog` row (already wired from Phase 7; verified end-to-end this pass). **Backend generalized**: `GET /admin/businesses` only supported a hardcoded PENDING filter before — widened to accept `status`/`cityId`/`businessTypeId`, serving both this page and Business Management from one endpoint.
- Business management: `/businesses` — all businesses with city/type/status filters, suspend/reactivate for verified businesses. Not yet built: bulk select + bulk-suspend, CSV export, order-count column — see [plate 13](docs/05-ui-wireframes/wireframe-gallery.html#s13). **New backend**: `listAll`/`count` on `BusinessRepository` (only `listByVerificationStatus` existed) and `PATCH /admin/businesses/:id/suspend`.
- Overview dashboard: `/overview` — GMV (MTD), active businesses, **Weekly Transacting Customers** (the PRD's own North Star metric, §4 — surfaced first, not buried), fulfillment rate, plus open disputes/support-queue counts, per [plate 14](docs/05-ui-wireframes/wireframe-gallery.html#s14). **`GET /admin/analytics/revenue` didn't exist before this pass** — documented in API Design but never implemented. GMV reads the same `business_sales_daily_mv` merchant analytics already use (one source of truth); WTC and fulfillment rate are live trailing-window queries, not materialized, since a rolling 7/30-day distinct-count doesn't fit the calendar-bucketed view. Not yet built: the city selector (single-city at MVP, per the wireframe's own annotation) and document preview on the verification queue (GST/PAN/bank-proof inline view) — no admin-facing documents endpoint exists yet.

### Public Web (`apps/web-public`) — reuses plates 01–03, read-only

Built from scratch this pass — was pure scaffolding (only `.env.example`) before. Server-rendered (Next.js App Router Server Components, not the client-only pattern web-merchant/web-admin use) so pages are indexable and fetch data at request time rather than round-tripping through client-side React Query. WIREFRAMES.md explicitly states this app isn't separately wireframed — it's "a server-rendered, read-only subset of screens 1–3's content" — so it reuses the Home/Search Results/Business Profile IA rather than inventing new layouts. A warm coral accent distinguishes it from web-merchant's teal and web-admin's indigo, since this is the consumer-facing surface, not a back-office tool.

- Home (`/`) — category grid (`GET /business-types`) and city list (`GET /cities`) as browse entry points, plus a "Shops near me" geolocation button. No saved-address picker (that's session-scoped, native-app-only per Architecture §4) — geolocation-on-tap is the closest read-only equivalent.
- Search (`/search`) — `GET /businesses` with the full filter set (open now, delivery, pickup, rating 4+, verified, city, category, text query, sort). Filters and the list/map view toggle are plain server-rendered links (URL is the only state), not client JS, so results stay crawlable and shareable. Map view is a labeled placeholder — no `GOOGLE_MAPS_API_KEY` is configured in this environment.
- Business profile (`/business/[slug]`) — banner/logo, verified badge, rating, open/closed, address + directions link, then Products/Services/Reviews/About as anchored sections (not client-side tabs, again for crawlability) backed by `GET /businesses/:slug`, `/products`, `/services`, `/reviews`. No cart or checkout anywhere — every transactional action routes through an "Open in app" CTA (`NEXT_PUBLIC_APP_STORE_URL`/`NEXT_PUBLIC_PLAY_STORE_URL`) per Architecture §4's native-app-only commerce boundary. **Known gap, not fabricated:** `Business` has no phone field in the schema, so the wireframe's "Call" contact button is omitted rather than faked; only Directions (from lat/lng) is wired up.
- Verified end-to-end this pass against a live API + Postgres: real category/city/business/product/service/review data renders correctly, unmatched searches correctly show the empty state, and unknown slugs 404 to a custom not-found page.
- Fixed three pre-existing repo-wide bugs found while verifying this app (affected every web app, including web-merchant/web-admin — none of the three had ever had a clean `pnpm lint`/`pnpm typecheck` run before this pass): `packages/config/eslint-preset.js` enabled type-aware ESLint rules without configuring `parserOptions` to generate type info, and its `ignores` globs (`.next/**`, `dist/**`) weren't `**/`-anchored so they never matched inside nested `apps/*/` directories — also added `checksVoidReturn: { attributes: false }` to `no-misused-promises`, since react-hook-form's idiomatic `onSubmit={handleSubmit(onSubmit)}` was tripping it in every form across every app. Every web app's `tsconfig.json` was also missing `"jsxImportSource": "react"` — React 19 stopped populating the global `JSX` namespace in favor of `React.JSX`, which silently breaks every `forwardRef`-based component's JSX-usage type-checking under `"jsx": "preserve"` (Next.js's own required setting) unless `jsxImportSource` is set explicitly. Also added the missing `"lib": ["ES2022", "DOM", "DOM.Iterable"]` to `apps/web-public/tsconfig.json`, which web-merchant/web-admin already had.

### Customer app (`apps/mobile-customer`) — plates 01–07

Built from scratch this pass — was pure scaffolding (package.json/README/tsconfig only) before. Expo/React Native (React Navigation, not Expo Router, per the pre-declared dependency set), OTP-phone auth, and the same warm coral accent as web-public — both are the customer-facing surface (Architecture §4), so the brand reads as one product across web and native.

- Auth: phone + OTP (`POST /auth/otp/request`, `/otp/verify`), refresh token in `expo-secure-store` (native's closest analog to the web apps' httpOnly cookie), in-memory access token re-derived on cold start.
- Home → Search → Business Profile → Product Detail → Cart & Checkout → Order Tracking (Model A), plus Service Enquiry (Model B), Orders list, Profile, and Addresses — all 7 wireframe plates, backed by the same discovery/cart/order/service-request endpoints web-public and web-merchant use.
- Order Tracking joins the `order:{orderId}` room on `apps/realtime` and live-updates on `order.status_changed`, falling back to a 20s poll.
- **Known gaps, not fabricated:** no live delivery-partner map on the tracking screen — `GET /orders/:id/track` doesn't expose the assigned partner's id or location, so there's nothing to join a `delivery:{partnerId}` room with (a real fix needs a new API field, out of scope here). No Razorpay in-app checkout SDK — `ONLINE` payment places the order and surfaces the gateway's order id, but doesn't complete payment; `COD` is the fully working path. Address form has no device geocoding, so new addresses use a placeholder lat/lng rather than a fabricated "precise" one.
- Verified via `typecheck`/`lint` (clean) and a real Metro bundle for both iOS and Android (1000+ modules resolved, not just type-checked) against a fresh fixture business in the live API.

### Delivery Partner app (`apps/mobile-delivery`) — plates 15–17

Also built from scratch this pass. A distinct blue accent (`#1E88E5`) — delivery partners are a fourth, separate persona from the wireframe's own framing, so this app earns its own brand rather than inheriting the customer app's coral or clashing with web-admin's indigo.

- Auth: same OTP flow as mobile-customer. First login without a `DeliveryPartner` profile routes to a Register screen (city + vehicle type/number → `POST /delivery-partners/register`) before the main app.
- Offers tab: online/offline toggle (`PATCH /delivery-partners/me/availability`), `expo-location`-driven nearby offers (`GET /me/offers`), Accept with an idempotency key. Active Delivery: two-step pickup → OTP-gated drop (`POST .../pickup`, `.../complete`). Earnings tab: wallet balance + ledger (`GET /me/wallet`, `/me/earnings`).
- **Known gap, not fabricated:** `DeliveryOffer` has no drop-off address field in the API — only `pickupAddress`. The Active Delivery screen says so explicitly rather than inventing a fake destination; OTP-gated completion still works end-to-end regardless.
- Live-location broadcast to customers goes through `apps/realtime`'s `location.update` event once wired up client-side — this pass wires the REST location-submission endpoint (`PATCH /me/location`) but doesn't yet emit the socket ping, since the two are redundant for a single-partner demo and the realtime contract only solidified alongside this work (see below).
- Verified the same way as mobile-customer: clean `typecheck`/`lint`, real Metro bundles for iOS and Android (~980 modules).

### Realtime gateway (`apps/realtime`)

Built from scratch this pass (previously scaffolding only) as a standalone Socket.IO gateway — plain Node/TypeScript, not NestJS, with no database access, per Architecture §14.

- JWT auth on every socket connection, byte-identical secret/algorithm/payload shape to `apps/api`'s own tokens (`{ sub, grants }`, HS256) — verified against real tokens, not assumed.
- Redis adapter (mandatory from MVP per the architecture doc) confirmed working cross-instance: two gateway processes on different ports, same Redis, relaying a `chat.message` from a client on instance A to a client connected only to instance B.
- Rooms: `business:{id}` (cryptographically authorized against JWT grants), `order:{id}` and `delivery:{id}` (capability-URL trust — a documented, deliberate gap since this service has no DB to verify resource ownership against; see `apps/realtime/README.md` for the full tradeoff writeup). Location pings throttled to 1/5s per partner, per Architecture §14.
- API → realtime wiring: this service subscribes to `events:order-status`/`events:order-new`/`events:delivery-location` over Redis Pub/Sub and rebroadcasts to the right rooms — verified against manually published test messages. **`apps/api` doesn't publish to these channels yet**; wiring that in is explicitly out of scope for this pass and documented as the next step.
- Verified end-to-end against a live Redis instance (not just typechecked): valid/invalid/missing token handling, grant-based room authorization, chat relay, the location throttle, and the cross-instance Redis adapter relay described above.

## Testing (Phase 9)

Scoped to `apps/api` — the highest concentration of correctness-critical logic (money, stock, auth) in the platform. The other 7 apps have no automated test suites yet; this is a real gap, not an oversight, and the next place to extend coverage.

- **Unit** (`pnpm --filter @app/api test`, 7 suites, fake in-memory repositories, no external dependencies): the order status state machine (every legal/illegal transition, including that a merchant can't act on another business's order), coupon validation (expiry, min-order, usage-limit, per-user-limit, percent/flat discount math including the "never exceed the subtotal" cap), refresh-token rotation — specifically the reuse-detection path that revokes an entire session family, the multi-tenant boundary in `PermissionGuard` (a business-scoped grant for business A must not satisfy a request against business B), AES-GCM field encryption (round-trip correctness, non-deterministic ciphertext, and that a tampered ciphertext is *rejected*, not silently corrupted), and OTP code generation.
- **Integration** (`pnpm --filter @app/api test:integration`, requires `pnpm infra:up`, real Postgres): the two places this codebase deliberately chose a conditional atomic `UPDATE` over a Redis lock (Database Design §6, Delivery module's ADR) — proved, not assumed, against a real database. Both fire many simultaneous real requests at the same row: 20 concurrent 1-unit stock decrements against a stock of 10 resolve to exactly 10 successes and a final stock of exactly 0 (never negative); 15 delivery partners simultaneously accepting the same offer resolve to exactly 1 winner, with the row correctly recording *that* winner, not an arbitrary loser.
- **Verification, not assertion**: while building these, `apps/api` itself had never had a clean lint pass — 14 real issues (unsafe `any` propagation from Express/cookie-parser's loose types, an RxJS `tap()` misuse that could have silently dropped idempotency-cache writes on error, an enum-comparison footgun, an unbound-method callback) were found and fixed as part of this phase, plus a `tsconfig`-inheritance bug where the test directory's own config accidentally excluded itself (`../tsconfig.json`'s `exclude: ["test"]` re-resolves to `../test` — i.e. itself — when inherited by a config living inside that same directory).
- **Not done**: e2e/HTTP-layer tests (supertest against the running Nest app, exercising guards/pipes/interceptors together), and no test coverage at all yet for `apps/worker`, `apps/realtime`, or any of the 5 frontend apps.

## Running Locally

Verified end-to-end this pass: `apps/api` serving real seeded data from Postgres, and `apps/web-merchant` rendering its login screen against that live API.

**1. Start infra** (Postgres+PostGIS, Redis, Meilisearch, MinIO — ports remapped by `docker-compose.override.yml` to avoid host conflicts):

```bash
pnpm infra:up
```

**2. Backend — `apps/api`** (NestJS, port 4000):

```bash
cd apps/api
cp .env.example .env   # only if apps/api/.env doesn't already exist — fill in real values
pnpm exec prisma generate
pnpm dev
```

Smoke-test it's serving real DB data:

```bash
curl -s http://localhost:4000/api/v1/business-types
```

**3. Frontend — `apps/web-merchant`** (Next.js, port 3001):

```bash
cd apps/web-merchant
cp .env.example .env   # only if apps/web-merchant/.env doesn't already exist
pnpm dev               # runs `next dev --port 3001`
```

`next.config.js` proxies `/api/v1/*` to `API_ORIGIN` (same-origin, so cookies/CORS aren't an issue) — no separate API base URL config needed in the browser.

**4. Open it:**

```
http://localhost:3001/login
```

You'll land on the merchant sign-in screen — use the test credentials below.

Other frontend apps (`web-admin`, `web-public`, `mobile-customer`, `mobile-delivery`) follow the same `.env.example` → `.env` → `pnpm dev` pattern.

### Test credentials

`apps/api/prisma/seed.ts` deliberately seeds no user accounts (reference data only — business types, roles/permissions, the launch city — see the comment at the top of that file for why: a script that also runs in production must never carry known credentials). The accounts below were created by hand through the real API for local manual testing; recreate them the same way after a fresh `prisma migrate reset`.

| App | Method | Credentials |
|---|---|---|
| `web-merchant` | email + password | `merchant.test@example.com` / `Test@1234` — owns a business ("Test Grocery Store", `PENDING` verification) with full `BUSINESS_OWNER` grants |
| `web-admin` | email + password | `admin.test@example.com` / `Test@1234` — `SUPER_ADMIN` role, all 14 platform permissions |
| `mobile-customer` | phone + OTP | any phone number works — request an OTP in-app, then read the 6-digit code from the `apps/api` server log (`grep "OTP for"`). There's no email/password and no fixed code: `OTP_SENDER` is hard-wired to a console logger in dev (`identity.module.ts`), so the code only ever appears in stdout. |
| `mobile-delivery` | phone + OTP | same OTP flow as above. After first login, the app's own registration screen posts to `POST delivery-partners/register` (vehicle type, city) to activate delivery-partner status — verification status starts `PENDING`. |
| `web-public` | none | browsing-only, no auth in this app |

To create a `SUPER_ADMIN`: register a user via `POST auth/register/email` or the OTP flow, then insert a row directly (there's no API for this by design — see the seed file comment):

```sql
INSERT INTO user_roles (id, user_id, role_id, business_id, city_id, created_at)
SELECT gen_random_uuid(), '<user-id>', r.id, NULL, NULL, now()
FROM roles r WHERE r.name = 'SUPER_ADMIN';
```
