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
| 7 | Backend Development | ✅ Complete — 9 domain modules + worker, verified end-to-end (migrations, seed, real API calls) | [apps/api](apps/api), [apps/worker](apps/worker) |
| 8 | Frontend Development | 🚧 In progress — Merchant Dashboard and Admin Panel complete | [apps/web-merchant](apps/web-merchant), [apps/web-admin](apps/web-admin) |
| 9 | Testing | ⏳ Not started | — |
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

**web-merchant** and **web-admin** have implementation started; both cover their full wireframe plate range as working vertical slices — MVP-scoped, not the fully polished wireframe fidelity (see gaps noted per feature below).

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

**web-public**, **mobile-customer**, **mobile-delivery**, and **realtime** remain unstarted (scaffolding only).
