# API Design

## Hyperlocal Digital Marketplace Platform

| | |
|---|---|
| **Owner** | Arutech Consultancy Services LLP |
| **Status** | Draft v1.0 — pending stakeholder approval |
| **Date** | 2026-07-11 |
| **Phase** | 4 of 10 |
| **Input** | [Architecture §8](../02-architecture/ARCHITECTURE.md#8-api-architecture), [schema.prisma](../03-database-design/schema.prisma) |
| **Next phase** | UI Wireframes |

**No hand-authored OpenAPI file in this repo.** Per [Architecture §8](../02-architecture/ARCHITECTURE.md#8-api-architecture), the real OpenAPI spec is generated from `@nestjs/swagger` decorators on the actual controllers at Phase 7 — a hand-written YAML produced now would drift from the implementation within a week and become actively misleading. This document is the **contract design** those controllers will implement: every resource, every endpoint, every auth/role requirement, and the conventions that make them consistent. Phase 7 implements this; it does not redesign it.

---

## Table of Contents

1. [Conventions](#1-conventions)
2. [Error Taxonomy](#2-error-taxonomy)
3. [Rate Limits](#3-rate-limits)
4. [Endpoint Catalog](#4-endpoint-catalog)
5. [Representative Payloads](#5-representative-payloads)
6. [Webhook Design](#6-webhook-design)
7. [Realtime Events (non-REST)](#7-realtime-events-non-rest)
8. [Open Questions](#8-open-questions)

---

## 1. Conventions

| | |
|---|---|
| **Base path** | `/api/v1` — URI versioning from the first commit ([Architecture §8](../02-architecture/ARCHITECTURE.md#8-api-architecture)) |
| **Auth** | `Authorization: Bearer <accessToken>` on every endpoint except public discovery reads and the payment webhook (§6) |
| **Content type** | `application/json` throughout; file uploads via pre-signed object-storage URLs (`POST .../upload-url` returns a signed PUT URL — the API never proxies binary payloads) |
| **Success envelope** | `{ "data": <resource or array>, "meta"?: {...} }` |
| **Error envelope** | `{ "error": { "code": string, "message": string, "details"?: object } }` — see [§2](#2-error-taxonomy) |
| **Pagination** | Cursor-based: request `?limit=20&cursor=<opaque>`, response `"meta": { "nextCursor": string \| null, "hasMore": boolean }`. Chosen over offset per [Architecture §8](../02-architecture/ARCHITECTURE.md#8-api-architecture) — no page-drift under concurrent writes, no slow `OFFSET` scans at scale. |
| **Filtering** | `?filter[field]=value`, combinable, AND-ed. Range filters use suffixes: `filter[priceMin]`, `filter[priceMax]`. |
| **Sorting** | `?sort=-createdAt` (`-` prefix = descending), whitelisted per endpoint — never an arbitrary passthrough to `ORDER BY`. |
| **Idempotency** | `Idempotency-Key: <client-generated-uuid>` header **required** on `POST /orders`, `POST /orders/:id/cancel`, `POST /payments/*`, `PATCH /merchant/orders/:id/status` — server stores the key+response for 24h in Redis and replays the original response on retry rather than re-executing. |
| **Validation** | class-validator DTOs at the controller boundary; a failed validation always returns `400 VALIDATION_ERROR` with per-field `details`. |
| **RBAC** | Every non-public endpoint declares required permission(s) via a NestJS guard decorator (e.g. `@RequirePermission('order.accept')`) — enforced server-side regardless of what the calling client's UI exposes. |

---

## 2. Error Taxonomy

| Code | HTTP Status | Meaning |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Request body/query failed DTO validation |
| `UNAUTHENTICATED` | 401 | Missing/expired/invalid access token |
| `FORBIDDEN` | 403 | Authenticated but lacks the required permission/role/business-scope |
| `NOT_FOUND` | 404 | Resource doesn't exist or isn't visible to this caller |
| `CONFLICT` | 409 | State conflict — e.g. accepting an already-accepted delivery, redeeming an exhausted coupon |
| `IDEMPOTENCY_KEY_REUSED` | 409 | Same idempotency key, different request body — rejected rather than silently returning the stale response |
| `RATE_LIMITED` | 429 | Rate limit exceeded — response includes `Retry-After` |
| `PAYMENT_FAILED` | 402 | Payment capture/verification failed |
| `STOCK_UNAVAILABLE` | 409 | Cart/checkout item's `stockQuantity` insufficient at order-placement time |
| `INTERNAL_ERROR` | 500 | Unhandled server error — logged with correlation ID, never exposes internals to the client |

---

## 3. Rate Limits

Per [Architecture §8/§17](../02-architecture/ARCHITECTURE.md#17-security-architecture) — brute-force/SMS-pumping is a real cost risk, not just a security nicety:

| Endpoint class | Limit |
|---|---|
| `POST /auth/otp/request` | 5 / hour per phone number, 20 / hour per IP |
| `POST /auth/otp/verify`, `/auth/login/*` | 10 / 15 min per IP |
| `POST /payments/razorpay/webhook` | Not user-rate-limited (verified by signature, see §6); infra-level DDoS protection instead |
| All other authenticated endpoints | 300 / min per user (default), overridable per endpoint |
| Public discovery endpoints (`GET /businesses`, `/search/suggest`) | 120 / min per IP (unauthenticated traffic) |

---

## 4. Endpoint Catalog

Grouped by client surface. `[Public]` = no auth. `[Customer]`/`[Merchant]`/`[Delivery]`/`[Admin]` = the permission scope required, per [Architecture §9](../02-architecture/ARCHITECTURE.md#9-authn--authz-architecture).

### 4.1 Auth & Identity

| Method | Path | Scope | Notes |
|---|---|---|---|
| POST | `/auth/register/email` | Public | Email + password |
| POST | `/auth/login/email` | Public | |
| POST | `/auth/otp/request` | Public | Sends OTP to phone |
| POST | `/auth/otp/verify` | Public | Verifies OTP, issues tokens (registers user if new) |
| POST | `/auth/oauth/google` | Public | Exchanges Google ID token for platform tokens |
| POST | `/auth/refresh` | Public* | Requires valid refresh token (cookie or body); rotates + reuse-detects per [Architecture §9](../02-architecture/ARCHITECTURE.md#9-authn--authz-architecture) |
| POST | `/auth/logout` | Customer | Revokes current refresh token |
| GET | `/auth/sessions` | Customer | List active sessions/devices |
| DELETE | `/auth/sessions/:id` | Customer | Revoke a specific session |

### 4.2 Customer Profile

| Method | Path | Scope | Notes |
|---|---|---|---|
| GET / PATCH | `/me` | Customer | Profile read/update |
| GET / POST | `/me/addresses` | Customer | Address book |
| PATCH / DELETE | `/me/addresses/:id` | Customer | |
| GET | `/me/wishlist` | Customer | |
| POST / DELETE | `/me/wishlist/:productId` | Customer | |
| GET | `/me/orders` | Customer | Paginated order history |
| GET | `/me/service-requests` | Customer | Model B enquiry history |
| GET | `/me/notifications` | Customer | In-app notification center |
| PATCH | `/me/notifications/:id/read` | Customer | |
| GET / PUT | `/me/notification-preferences` | Customer | |

### 4.3 Discovery & Search

| Method | Path | Scope | Notes |
|---|---|---|---|
| GET | `/businesses` | Public | Core search — `q`, `city`, `pin`, `businessTypeId`, `lat`+`lng`+`radiusM`, `filter[rating]`, `filter[openNow]`, `filter[deliveryAvailable]`, `filter[pickupAvailable]`, `filter[verified]`; backed by Meilisearch per [Architecture §11](../02-architecture/ARCHITECTURE.md#11-search--discovery-architecture) |
| GET | `/businesses/:slug` | Public | Full profile |
| GET | `/businesses/:id/products` | Public | Paginated, filterable by `categoryId` |
| GET | `/businesses/:id/services` | Public | |
| GET | `/businesses/:id/reviews` | Public | |
| GET | `/business-types` | Public | The ~25 platform categories, for browse/filter UI |
| GET | `/cities` | Public | Active launch cities — populates the city picker on the merchant Store Setup Wizard and customer location switcher |
| GET | `/search/suggest` | Public | Typeahead — shop/product/category/brand names |

### 4.4 Cart & Checkout (Model A)

| Method | Path | Scope | Notes |
|---|---|---|---|
| GET | `/carts/:businessId` | Customer | Gets or lazily creates the active cart for this business |
| POST | `/carts/:businessId/items` | Customer | |
| PATCH / DELETE | `/carts/:businessId/items/:itemId` | Customer | |
| POST | `/carts/:businessId/apply-coupon` | Customer | Validates against `Coupon` rules + `CouponRedemption` usage count |
| POST | `/orders` | Customer | **Checkout.** Idempotency-Key required. See [§5.2](#52-checkout-post-orders) |
| GET | `/orders/:id` | Customer | |
| GET | `/orders/:id/track` | Customer | Status timeline from `OrderStatusHistory` |
| POST | `/orders/:id/cancel` | Customer | Only valid pre-fulfillment states; reason required |
| GET | `/orders/:id/invoice` | Customer | Signed URL to the generated invoice PDF |

### 4.5 Service Requests (Model B, MVP)

| Method | Path | Scope | Notes |
|---|---|---|---|
| POST | `/service-requests` | Customer | Enquiry, not a booking — see [Architecture §6](../02-architecture/ARCHITECTURE.md#6-domain--bounded-context-map) |
| GET | `/service-requests/:id` | Customer | |

### 4.6 Reviews

| Method | Path | Scope | Notes |
|---|---|---|---|
| POST | `/orders/:id/review` | Customer | Only after `DELIVERED`/`COMPLETED` |
| GET | `/businesses/:id/reviews` | Public | (duplicate of §4.3, listed once) |
| POST | `/merchant/reviews/:id/reply` | Merchant | One reply per review |

### 4.7 Merchant Dashboard

All under `/merchant`, scoped to businesses the caller has a `UserRole` for.

| Method | Path | Scope | Notes |
|---|---|---|---|
| POST | `/merchant/businesses` | Customer→Merchant | Registration; creates `Business` in `PENDING` verification |
| PATCH | `/merchant/businesses/:id` | Merchant | Profile/hours/delivery-radius edits |
| POST | `/merchant/businesses/:id/documents` | Merchant | GST/PAN/FSSAI/bank-proof upload references |
| PUT | `/merchant/businesses/:id/bank-details` | Merchant | Creates a new `BusinessBankDetail` row (historized, never edited in place) |
| PUT | `/merchant/businesses/:id/hours` | Merchant | |
| POST | `/merchant/businesses/:id/media` | Merchant | Logo/banner/gallery |
| CRUD | `/merchant/businesses/:id/categories` | Merchant | |
| CRUD | `/merchant/businesses/:id/products` | Merchant | Includes nested `/products/:id/variants`, `/products/:id/images` |
| POST | `/merchant/businesses/:id/products/import` | Merchant | CSV bulk import — returns per-row validation results, not a silent partial failure |
| CRUD | `/merchant/businesses/:id/services` | Merchant | |
| GET | `/merchant/businesses/:id/orders` | Merchant | `filter[status]`, `sort=-createdAt` |
| PATCH | `/merchant/orders/:id/status` | Merchant | Drives the `OrderStatus` state machine; Idempotency-Key required |
| GET | `/merchant/businesses/:id/service-requests` | Merchant | |
| PATCH | `/merchant/service-requests/:id` | Merchant | Confirm/decline/reschedule |
| CRUD | `/merchant/businesses/:id/coupons` | Merchant | |
| GET | `/merchant/businesses/:id/staff` | Merchant (owner) | Lists `UserRole` rows scoped to this business |
| POST | `/merchant/businesses/:id/staff/invite` | Merchant (owner) | |
| DELETE | `/merchant/businesses/:id/staff/:userRoleId` | Merchant (owner) | |
| GET | `/merchant/businesses/:id/analytics/sales` | Merchant | Pre-aggregated rollups per [Architecture §4.6](../03-database-design/DATABASE_DESIGN.md#46-analytics-is-materialized-views-not-tables) |

### 4.8 Delivery Partner

| Method | Path | Scope | Notes |
|---|---|---|---|
| POST | `/delivery-partners/register` | Customer→Delivery | |
| POST | `/delivery-partners/documents` | Delivery | |
| PATCH | `/delivery-partners/me/availability` | Delivery | Online/offline toggle |
| GET | `/delivery-partners/me/offers` | Delivery | Eligible unassigned deliveries near current location |
| POST | `/delivery-partners/deliveries/:id/accept` | Delivery | Redis distributed lock, [Architecture §15](../02-architecture/ARCHITECTURE.md#15-caching-strategy) — exactly one partner wins on concurrent accept |
| POST | `/delivery-partners/deliveries/:id/pickup` | Delivery | |
| POST | `/delivery-partners/deliveries/:id/complete` | Delivery | Requires OTP in body |
| GET | `/delivery-partners/me/earnings` | Delivery | |
| GET | `/delivery-partners/me/wallet` | Delivery | Derived balance, [Database Design §4.1](../03-database-design/DATABASE_DESIGN.md#41-ledgers-not-balance-columns) |

### 4.9 Admin

All under `/admin`, RBAC-gated per permission key.

| Method | Path | Scope | Notes |
|---|---|---|---|
| GET | `/admin/businesses` | Admin | `?status=PENDING` drives the verification queue; unfiltered (or `?cityId=`/`?businessTypeId=`) drives Business Management |
| GET | `/admin/businesses/count` | Admin | Same filters as above, count only — powers Overview Dashboard's Active Businesses tile |
| PATCH | `/admin/businesses/:id/verify` | Admin | Approve/reject + reason; writes `AuditLog` |
| PATCH | `/admin/businesses/:id/suspend` | Admin | `{ suspend: boolean }` — suspend or reactivate an already-verified business; writes `AuditLog` |
| GET | `/admin/delivery-partners` | Admin | Same pattern |
| PATCH | `/admin/delivery-partners/:id/verify` | Admin | |
| CRUD | `/admin/business-types` | Admin | The ~25-category taxonomy |
| CRUD | `/admin/cities` | Admin | |
| GET | `/admin/orders` | Admin | Full oversight view, heavily filterable |
| GET / PATCH | `/admin/disputes` | Admin | |
| GET / POST / PATCH | `/admin/support-tickets` | Admin | Ticket queue + `TicketMessage` thread |
| GET | `/admin/audit-logs` | Admin | `filter[entityType]`, `filter[entityId]`, `filter[actorUserId]` |
| CRUD | `/admin/roles`, `/admin/permissions` | Admin (super) | RBAC management |
| GET | `/admin/analytics/revenue` | Admin | Platform-wide financial dashboard |

---

## 5. Representative Payloads

Full field-level schemas live in the generated OpenAPI spec (Phase 7); these three are worked through end-to-end because they're the highest-stakes contracts in the system.

### 5.1 OTP Verify — `POST /auth/otp/verify`

```json
// Request
{ "phone": "+919812345678", "code": "482913" }

// 200 Response
{
  "data": {
    "user": { "id": "…", "fullName": null, "phone": "+919812345678", "isNewUser": true },
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}

// 401 Response
{ "error": { "code": "VALIDATION_ERROR", "message": "Invalid or expired OTP", "details": { "attemptsRemaining": 2 } } }
```

### 5.2 Checkout — `POST /orders`

Amount is **never** trusted from the client — server recomputes from the live cart, per [Architecture §10](../02-architecture/ARCHITECTURE.md#10-payments-architecture).

```json
// Request
// Headers: Idempotency-Key: 5b1b2e2e-...
{
  "businessId": "…",
  "cartId": "…",
  "fulfillmentType": "DELIVERY",
  "addressId": "…",
  "paymentMethod": "ONLINE",
  "couponCode": "WELCOME50"
}

// 201 Response
{
  "data": {
    "order": {
      "id": "…", "orderNumber": "ORD-2026-000123", "status": "PLACED",
      "subtotalPaise": 45000, "deliveryFeePaise": 2500, "platformFeePaise": 500,
      "discountPaise": 5000, "totalPaise": 43000,
      "paymentMethod": "ONLINE", "paymentStatus": "PENDING"
    },
    "payment": {
      "provider": "RAZORPAY",
      "razorpayOrderId": "order_...",
      "amountPaise": 43000,
      "keyId": "rzp_live_..."
    }
  }
}

// 409 Response (stock changed between cart and checkout)
{ "error": { "code": "STOCK_UNAVAILABLE", "message": "Some items are no longer available", "details": { "unavailableItems": ["…variantId…"] } } }
```

Client completes payment with the Razorpay Checkout SDK using `razorpayOrderId`; the order is confirmed server-side only on the verified webhook (§6), never on the client-side SDK success callback alone.

### 5.3 Business Search — `GET /businesses`

```
GET /businesses?q=grocery&lat=19.0760&lng=72.8777&radiusM=3000&filter[openNow]=true&filter[deliveryAvailable]=true&sort=distance&limit=20
```

```json
{
  "data": [
    {
      "id": "…", "slug": "ramesh-general-store", "name": "Ramesh General Store",
      "businessType": { "id": "…", "name": "Grocery" },
      "logoUrl": "…", "ratingAvg": 4.6, "distanceMeters": 850,
      "isOpen": true, "deliveryEnabled": true, "pickupEnabled": true,
      "verificationStatus": "VERIFIED"
    }
  ],
  "meta": { "nextCursor": "eyJvZmZzZXQiOjIwfQ", "hasMore": true }
}
```

---

## 6. Webhook Design

`POST /payments/razorpay/webhook` — the one endpoint with no user bearer-token auth, secured instead by:

1. **HMAC signature verification** against the raw request body using the Razorpay webhook secret (configured server-side only) — requests with a missing/invalid signature are rejected `401` before any business logic runs.
2. **Idempotent processing** — Razorpay retries webhooks on non-2xx; the handler upserts by `providerRefId` on `PaymentTransaction` so a redelivered webhook for an already-processed event is a no-op, not a double-credit.
3. **Fast acknowledgment** — the handler validates and enqueues a `payment-confirmation` job (BullMQ), returning `200` immediately; order-status transition and notification dispatch happen in the Worker, not on the webhook request path, so a slow downstream step never causes Razorpay to time out and retry unnecessarily.

Same pattern reserved for a future Stripe webhook endpoint (`/payments/stripe/webhook`) behind the same abstraction, per [Architecture ADR-008](../02-architecture/ARCHITECTURE.md#adr-008-razorpay-as-payment-aggregator-with-route-for-split-settlement).

---

## 7. Realtime Events (non-REST)

Socket.IO, not REST — documented here for API-surface completeness since clients treat it as part of "the API." Full mechanics in [Architecture §14](../02-architecture/ARCHITECTURE.md#14-realtime-architecture).

| Room | Event | Payload | Consumers |
|---|---|---|---|
| `order:{orderId}` | `order.status_changed` | `{ orderId, status, timestamp }` | Customer, Merchant |
| `order:{orderId}` | `chat.message` | `{ orderId, senderId, message, timestamp }` | Customer, Merchant |
| `delivery:{partnerId}` | `location.updated` | `{ lat, lng, timestamp }` | Customer (active-delivery screen), throttled to 1/5s |
| `business:{businessId}` | `order.new` | `{ orderId, summary }` | Merchant dashboard live feed |

---

## 8. Open Questions

None block Phase 5 (UI Wireframes) — every screen the PRD describes has a corresponding endpoint above. One implementation-time detail flagged for Phase 7:

- **CSV import error format** (§4.7, `/merchant/businesses/:id/products/import`) — exact per-row error schema is worth a quick merchant-UX pass during Phase 8, not a Phase 4 blocker.

---

**Status:** Ready for review. Phase 5 (UI Wireframes) will design the screens that call these endpoints.
