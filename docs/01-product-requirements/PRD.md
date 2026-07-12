# Product Requirements Document (PRD)

## Hyperlocal Digital Marketplace Platform

| | |
|---|---|
| **Owner** | Arutech Consultancy Services LLP |
| **Status** | v1.1 — key scope decisions confirmed by stakeholder (2026-07-11); pending final sign-off to enter Phase 2 |
| **Date** | 2026-07-11 |
| **Phase** | 1 of 10 |
| **Next phase** | System Architecture (blocked until this doc is approved) |

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Vision & Strategic Context](#2-vision--strategic-context)
3. [Problem Statement & Opportunity](#3-problem-statement--opportunity)
4. [Goals & Success Metrics](#4-goals--success-metrics)
5. [User Personas](#5-user-personas)
6. [Business Vertical Taxonomy & MVP Sequencing](#6-business-vertical-taxonomy--mvp-sequencing)
7. [Scope Definition (MoSCoW by Release)](#7-scope-definition-moscow-by-release)
8. [Functional Requirements](#8-functional-requirements)
9. [Non-Functional Requirements](#9-non-functional-requirements)
10. [Monetization & Business Model](#10-monetization--business-model)
11. [Compliance & Regulatory (India)](#11-compliance--regulatory-india)
12. [Technical Direction (Preview)](#12-technical-direction-preview)
13. [Assumptions & Dependencies](#13-assumptions--dependencies)
14. [Out of Scope](#14-out-of-scope)
15. [Risks & Mitigations](#15-risks--mitigations)
16. [Open Decisions Requiring Stakeholder Input](#16-open-decisions-requiring-stakeholder-input)
17. [Glossary](#17-glossary)

---

## 1. Executive Summary

The Platform lets any local business — from a vegetable cart to a CA office — stand up a digital storefront in minutes, get discovered by nearby customers, and transact online (order, book, pay, deliver/pickup). It is a **multi-vertical hyperlocal marketplace**: one product serving fundamentally different business models (retail commerce, food, and appointment-based services) under a shared discovery, identity, payments, and operations layer.

The central product risk is **scope collapse**: the brief enumerates ~25 business categories and near-total feature parity with mature vertical leaders (Swiggy Instamart, BigBasket, Urban Company, JustDial, Zomato) simultaneously. Section 6 makes the single highest-leverage recommendation in this document — **sequence verticals instead of building all of them at once** — because product-commerce (cart → pay → deliver) and appointment-commerce (browse → book a slot → service) are different core loops with different data models, ops, and failure modes. Building both fully in parallel before either has a real user is the most common reason platforms like this miss their launch window.

Everything below is written so Phase 2 (Architecture) has an unambiguous, prioritized brief to build against.

---

## 2. Vision & Strategic Context

**Vision:** Every local business, regardless of size or technical sophistication, has a professional digital presence and can sell online — without needing to be a "tech company" to do it.

**Strategic fit for Arutech Consultancy Services LLP:** demonstrates the company's AI-first, cloud-native, SaaS engineering capability as a flagship platform, and creates a durable, scalable revenue base (commission + SaaS subscriptions + ads) rather than a one-off client project.

**Category comparison** (for architectural calibration, not feature copying):

| Reference | What we borrow |
|---|---|
| Swiggy Instamart / BigBasket | Cart, dark-store-agnostic catalog, delivery-radius commerce |
| Urban Company | Slot-based service booking, professional marketplace trust (verification, ratings) |
| JustDial | Discovery-first, "just call/WhatsApp the business," directory-grade breadth of categories |
| Shopify | Merchant self-serve storefront builder, plans/subscriptions |

No category leader does all four well simultaneously — that's the product bet here, and exactly why sequencing (Section 6) matters.

---

## 3. Problem Statement & Opportunity

**Customer problem:** Discovering what's actually available nearby *right now* (stock, hours, price) is fragmented across WhatsApp statuses, phone calls, and walk-ins. There's no reliable way to search, compare, and transact with local businesses the way one can with large e-commerce platforms.

**Business owner problem:** Local businesses are digitally excluded — building an app or website is too expensive/technical, and existing large marketplaces either don't serve their category, charge commissions incompatible with thin retail margins, or bury them under national sellers.

**Delivery partner problem:** Fragmented gig opportunities across many small apps; no unified earnings/wallet experience for hyperlocal delivery work.

**Opportunity:** Become the default local commerce layer for a city/region — the "operating system" for local business discovery and transaction — with defensible density (more businesses → more customers → more businesses) at the neighborhood level.

---

## 4. Goals & Success Metrics

### North Star Metric
**Weekly Transacting Customers (WTC)** in launch city — customers completing ≥1 paid order or confirmed booking per week. Chosen over GMV because it forces early focus on repeat usage and liquidity density rather than one-off volume from discounting.

### Supporting Metrics

| Category | Metric | MVP Target (90 days post-launch, single city) |
|---|---|---|
| Supply | Verified businesses live | 500+ |
| Supply | Business activation rate (≥1 order within 14 days of going live) | ≥60% |
| Demand | D7 customer retention | ≥25% |
| Demand | D30 repeat order rate | ≥20% |
| Marketplace health | Order fulfillment rate (delivered / accepted) | ≥95% |
| Marketplace health | Order cancellation rate | ≤5% |
| Operations | Median delivery time (product verticals) | ≤40 min |
| Financial | Take rate (blended commission) | 8–15% category-dependent |
| Financial | CAC : LTV | ≤1:3 by month 6 |

These are placeholders for the business/finance team to calibrate — flagged in [Section 16](#16-open-decisions-requiring-stakeholder-input).

---

## 5. User Personas

### 5.1 Customer — "Neha, 29, working professional"
Orders groceries and dinner on weekdays, books a salon appointment on weekends, wants to know a shop is *actually open and has stock* before walking over. Pain: calling five shops to check price/availability. Needs: fast search, trust signals (verified, ratings), WhatsApp-level low-friction contact, reliable delivery ETA.

### 5.2 Business Owner — "Ramesh, 45, kirana store owner"
Runs a single grocery store, moderate smartphone literacy, currently takes orders over WhatsApp/phone manually. Pain: no inventory visibility, missed orders, no way to reach new customers beyond word-of-mouth. Needs: dead-simple store setup (photos + price list, not a 40-field form), order notifications he can't miss, payouts he can trust, low/negotiable commission.

### 5.3 Business Owner (Service) — "Priya, 34, salon owner"
Runs a 3-chair salon with 2 staff. Pain: no-shows, phone-tag for booking, no visibility into staff utilization. Needs: slot calendar, staff assignment, booking reminders, walk-in vs. booked distinction. *(Note: this persona's core loop is a scheduling engine, not a cart — see Section 6.)*

### 5.4 Delivery Partner — "Suresh, 24, gig worker"
Works across multiple delivery apps for hours flexibility and income stacking. Pain: fragmented earnings, unclear payout timing, poor navigation/OTP flows increase per-order time. Needs: reliable order queue, transparent per-order earnings, fast payout, in-app navigation.

### 5.5 Administrator/Ops — "Internal Arutech ops team"
Verifies new businesses (GST/PAN/bank), resolves disputes, monitors fraud (fake orders, COD abuse), manages category taxonomy and featured placements. Needs: audit trails, RBAC-scoped tooling, bulk actions, dispute/refund workflows with evidence trails.

---

## 6. Business Vertical Taxonomy & MVP Sequencing

**Recommendation: split the ~25 business categories into two *commerce models*, not 25 independent feature sets, and launch product-commerce before appointment-commerce.**

| Commerce model | Categories | Core loop |
|---|---|---|
| **A. Product commerce** | Grocery, Vegetables, Medical/Pharmacy, Stationery, Hardware, Electronics, Mobile Shops, Bakery, Clothing, Furniture, Restaurants | Browse catalog → cart → checkout → pay → deliver/pickup |
| **B. Appointment/service commerce** | Salons, Clinics, Coaching Centers, Repair Centers, Consultants, CA Offices, Lawyers, Agencies, Freelancers, Offices | Browse services → pick slot/staff → book → (pay upfront or on-completion) → service delivered |

These two models share identity, discovery, business profile, reviews, chat, and payments — but diverge hard on the transactional core: inventory + delivery logistics vs. calendar + staff/resource scheduling + no-show handling. Building both engines simultaneously before either is proven roughly doubles Phase 7 scope and risks shipping neither well.

**Recommended sequencing:**

- **MVP (Launch):** Every business category gets a **discovery-grade profile** on day one (logo, banner, gallery, description, hours, location, contact, WhatsApp deep link, directions) — this alone delivers the "every business gets a digital showroom" promise and is valuable even without checkout. Full **cart → pay → delivery** is built for **Commerce Model A only**. Commerce Model B businesses in MVP get a lightweight **"Request/Enquiry"** flow (customer submits a request with preferred time; business confirms manually via dashboard/WhatsApp) — no calendar engine yet.
- **V1.1 (fast-follow, ~6–10 weeks post-launch):** Full slot-based booking engine (staff calendars, service duration, buffer times, no-show/cancellation policy) for Commerce Model B.
- **V2:** Advanced features — subscriptions/repeat orders, loyalty, AI recommendations, ads marketplace, multi-city expansion tooling.

**Trade-off:** this narrows launch-day feature parity with the full brief, but converts a 25-category, two-engine build into one hardened commerce engine plus a universal directory layer, which is achievable in a realistic Phase 7 timeline and still fulfills the core value proposition for every category. The alternative (build both engines fully before launch) delays first revenue and first learning by months for marginal day-one benefit, since even product-commerce categories (grocery) generate the bulk of transaction volume and learning signal fastest.

**✅ Confirmed by stakeholder (2026-07-11):** sequencing approach approved as recommended above.

---

## 7. Scope Definition (MoSCoW by Release)

Legend: **M**ust (MVP) / **S**hould (V1.1) / **C**ould (V2) / **W**on't (this horizon)

| Area | MVP (M) | V1.1 (S) | V2 (C) |
|---|---|---|---|
| Customer auth | Email, Mobile OTP, Google | Apple Sign-In | — |
| Discovery | Search, filters, map view, category browse | Voice search | AI image search |
| Business profile | Full profile, gallery, hours, reviews, WhatsApp/directions | Chat with business (in-app) | — |
| Commerce (Model A) | Cart, checkout, coupons, COD, 1 payment gateway | 2nd/3rd gateway, saved cards | Subscriptions/repeat orders |
| Commerce (Model B) | Request/enquiry flow | Full slot booking + staff calendar | AI-suggested slots |
| Order tracking | Status timeline, push/SMS notifications | Live rider location (map) | ETA ML prediction |
| Merchant dashboard | Store setup, catalog CRUD, order accept/reject/fulfill, sales summary | Bulk CSV import, staff accounts, coupons | Demand forecasting, inventory suggestions |
| Delivery partner app | Registration, accept/deliver, OTP handoff, earnings ledger | In-app navigation, wallet payouts | Route batching/optimization |
| Admin panel | Verification queue, user/business mgmt, category mgmt, order/payment oversight, RBAC | Featured listings, ads mgmt, CMS | Fraud ML, premium analytics products |
| Payments | 1 primary gateway (Razorpay) + COD | Stripe abstraction (intl-ready), UPI autopay | Wallet/credit system |
| Reviews/Trust | Ratings + text reviews, verified-business badge | Photo reviews, business replies | — |
| AI | — (architecturally reserved, not built) | Chat assistant (support), search relevance tuning | Recommendations, forecasting, OCR, voice/image search |
| Client apps | **Native** customer app + native delivery-partner app (both, confirmed MVP); merchant dashboard + admin panel as responsive web | Deeper native features (widgets, native push richness) | — |

---

## 8. Functional Requirements

Each block lists MVP-scoped acceptance criteria. Items tagged *(V1.1)*/*(V2)* are documented for architectural forward-compatibility but not built at launch.

### 8.1 Customer

**Authentication & Profile**
- Given a new user, they can register/login via email+password, mobile OTP, or Google OAuth, and land on a completed profile only after verifying at least one contact channel.
- Users manage a multi-entry address book (label, geo-pin, landmark) used for delivery and "nearby" search radius.
- Wishlist/favorites persist across sessions and devices (server-side, not local-only).

**Search & Discovery**
- Search resolves across shop name, product/service name, category, brand, and location (PIN/city/geo) in a single query with typo tolerance.
- Filters: distance, price range, rating, open-now, delivery available, pickup available, verified-only — combinable, reflected in the URL/query state (shareable/bookmarkable).
- Map view plots businesses as pins within the active search radius; pin tap opens a business preview card without full navigation.

**Business Profile & Transaction**
- Business profile renders logo, banner, gallery, description, category tags, hours (with live open/closed state computed from timezone + hours), delivery radius/time, policies, and aggregate rating.
- Model A: cart supports multi-item, quantity edit, coupon application, computed taxes/delivery charge/platform fee shown itemized before payment.
- Checkout supports the primary payment gateway and COD (where the business allows it); COD availability is a per-business toggle.
- Order tracking shows a status timeline (Accepted → Packing → Ready → Out for Delivery/Ready for Pickup → Delivered/Completed → [Cancelled]) with push + SMS on each transition.
- Model B (MVP): customer submits a request (service, preferred date/time window, notes); business accepts/declines/reschedules via dashboard; customer notified of outcome. No live calendar shown to customer in MVP.
- Post-fulfillment: customer can submit a rating + review, and initiate a return/refund request (Model A) within a business-configured window.

### 8.2 Business Owner

**Onboarding & Verification**
- Registration collects business category, GST (optional if below threshold — validated format if provided), PAN, bank/UPI payout details, and supporting documents; business is **not** publicly listed until admin verification passes.
- Store setup wizard: logo, banner, description, category, hours, delivery radius (Model A) or service area (Model B), minimum order value, pickup toggle — designed to be completable on a phone in under 10 minutes (addresses the Ramesh persona directly).

**Catalog / Service Management**
- Products: unlimited categories/subcategories, variants (size/weight/color), stock quantity with low-stock and out-of-stock states, multi-image upload, scheduled discounts.
- Bulk operations: CSV import/export with a documented schema and row-level validation errors returned (not a silent partial failure).
- Model B (MVP): service list with name, description, price, est. duration — no calendar config required at MVP.

**Order Operations**
- Orders arrive with a push notification the merchant cannot silently miss (sound/vibration escalation for unacknowledged orders past a threshold — configurable, addresses the "missed orders" pain point directly).
- Explicit state machine: Placed → Accepted/Rejected → Packing → Ready → Out for Delivery/Picked Up → Delivered/Completed, with Cancelled reachable from any pre-fulfillment state and a required reason code.

**Insights**
- Sales dashboard: daily/weekly/monthly revenue, order count, top products, new vs. repeat customers — MVP ships pre-aggregated rollups (not ad-hoc query UI) for performance and simplicity.

### 8.3 Delivery Partner

- Registration with vehicle type and document upload; gated behind admin verification like businesses.
- Availability toggle (online/offline) drives order-offer eligibility.
- Order accept/reject with a visible countdown timer; accepted orders show pickup and drop navigation and require OTP entry at drop to mark delivered (fraud/dispute prevention).
- Earnings ledger: per-order breakdown, running wallet balance, payout history with status.

### 8.4 Administrator

- RBAC-scoped roles (e.g., Ops Verifier, Finance, Support, Super Admin) — every admin action is attributable and logged (audit log is Should-have MVP, not deferred, given financial/verification stakes).
- Verification queue for businesses and delivery partners with document preview and approve/reject + reason.
- Full entity management (users, businesses, categories, products/services, orders, payments, refunds/disputes) with search/filter/pagination.
- Support ticket queue linked to order/business/customer context (not a standalone disconnected helpdesk).

---

## 9. Non-Functional Requirements

| Category | Requirement |
|---|---|
| **Performance** | p95 API response < 300ms for read endpoints, < 800ms for write/checkout endpoints, under nominal launch-city load. Search-as-you-type < 150ms perceived latency. |
| **Availability** | 99.5% uptime target for MVP (single-region); 99.9% target post-multi-AZ hardening. |
| **Scalability** | Stateless application tier horizontally scalable; database and search layers designed for read-replica scale-out from day one (full detail in Phase 2). |
| **Security** | OWASP Top 10 mitigations by default, encrypted secrets at rest, PII encryption for sensitive fields, mandatory HTTPS/HSTS, RBAC everywhere admin/merchant actions touch other users' data. |
| **Data privacy** | Compliant with India's Digital Personal Data Protection Act, 2023 (DPDPA) — consent capture, data minimization, right to erasure workflow. |
| **Accessibility** | WCAG 2.1 AA target for customer-facing web app. |
| **Localization** | India-first (INR, DD/MM/YYYY, Indian address format, PIN code search) with i18n scaffolding for future languages/regions — not multi-language at MVP. |
| **Observability** | Structured logging, distributed tracing, and business-metric dashboards required before GA (not bolted on post-launch). |
| **Disaster recovery** | RPO ≤ 1 hour, RTO ≤ 4 hours for MVP via automated DB backups + tested restore runbook. |

---

## 10. Monetization & Business Model

Primary (MVP):
1. **Commission per transaction** — category-dependent rate (Section 4 table), the core revenue line.
2. **Delivery fee** — pass-through to customer, configurable split between platform and delivery partner.
3. **Platform fee** — small fixed/percentage fee per order for payment processing + platform overhead, itemized transparently at checkout (regulatory and trust reasons — hidden fees are a top driver of marketplace churn).

Secondary (V1.1+):
4. **Merchant subscription plans** (tiered: Free/Growth/Pro) unlocking analytics depth, staff seats, featured placement quota.
5. **Featured listings & ads** — self-serve merchant-boosted visibility in search/category pages.
6. **Premium analytics** — demand forecasting, competitive benchmarking (ties to AI roadmap, Section 12).

**Recommendation:** do not activate subscription plans or ads at MVP — commission + delivery + platform fee alone should validate unit economics first; layering monetization complexity before liquidity exists slows merchant activation (Ramesh persona is price-sensitive and adoption-hesitant).

---

## 11. Compliance & Regulatory (India)

- **GST**: invoice generation must support GSTIN capture and GST-compliant invoice line items for B2B-eligible orders.
- **DPDPA 2023**: consent management, data subject rights (access/erasure), breach notification readiness.
- **RBI Payment Aggregator guidelines**: since order payments flow through the platform to many merchants, the payment integration must run through an RBI-authorized Payment Aggregator (e.g., Razorpay/PhonePe as PA, not a raw payment gateway) with merchant KYC handled by the PA — this directly shapes the "Bank Details/UPI" onboarding field and Phase 2 payment architecture.
- **FSSAI**: restaurants/food/bakery categories require FSSAI license number capture during verification.
- **Consumer Protection (E-Commerce) Rules, 2020**: mandatory display of seller (business) legal name, return/refund policy, and grievance officer contact.

---

## 12. Technical Direction (Preview)

Full rationale is Phase 2's job; three calls are flagged now because they affect Phase-1-adjacent scope/cost:

- **Search:** Meilisearch over Elasticsearch for MVP — comparable relevance/typo-tolerance for catalog+business search at hyperlocal scale with materially lower operational overhead; revisit Elasticsearch only if advanced analytics-grade aggregation needs emerge.
- **Maps:** Google Maps Platform for MVP given India geocoding/Places accuracy; OpenStreetMap kept as an abstracted fallback for cost control at scale, not a day-one dual build.
- **API style:** REST + OpenAPI as the single source of truth for MVP; GraphQL gateway deferred until a concrete client-side aggregation need justifies maintaining two API paradigms.
- **Payments:** Razorpay as primary Payment Aggregator (UPI/cards/wallets/COD reconciliation, marketplace split settlement via Route), Stripe kept behind an abstraction for future international expansion, not wired to a live merchant at MVP.
- **Native apps (confirmed MVP, per stakeholder decision):** recommend **React Native** for the customer and delivery-partner apps over separate Swift/Kotlin native codebases — maximizes logic/type-sharing with the TypeScript/Next.js web stack (shared API clients, validation schemas via Zod, design tokens) and halves the mobile build surface (one codebase, two platforms) at a stage where engineering velocity matters more than platform-specific polish. Merchant dashboard and admin panel remain responsive web — those are desk-bound, dense-data workflows (catalog CRUD, verification queues) that are a poor fit for native/mobile-first UX and would duplicate effort for no user benefit. Full rationale and any exceptions (e.g., native-only APIs needed for delivery-partner background location/navigation) are Phase 2's job.

---

## 13. Assumptions & Dependencies

- **Confirmed:** launch is single-city/neighborhood — multi-city expansion tooling (city-based catalogs, cross-city admin scoping) is a V2 architectural concern, not MVP.
- **Confirmed:** delivery execution model is **platform-recruited delivery partners** for Model A categories; merchant self-delivery/pickup remains available as a fallback per-business toggle. Delivery Partner app is Must-have for MVP.
- WhatsApp integration at MVP is a deep-link ("Chat on WhatsApp" opening the business's WhatsApp with a prefilled message), not the paid WhatsApp Business API — full Business API (templated notifications, in-app chat parity) is V1.1.
- Business owners will have smartphones but variable digital literacy — onboarding UX must be designed for this floor, not assumed away.

---

## 14. Out of Scope

Explicitly not building at any horizon covered by this PRD unless re-scoped:
- Dark-store/warehouse inventory management (this platform is a marketplace layer over existing local businesses, not a quick-commerce warehouse operator).
- Own-fleet logistics hardware/telematics integration.
- Business accounting/bookkeeping suite beyond invoice generation.
- Native desktop apps (out of scope at every horizon; merchant/admin surfaces are responsive web only).

---

## 15. Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Scope collapse building 25 categories × 2 commerce engines at once | Missed launch window, low quality everywhere | Section 6 sequencing; MVP gate on Model A depth + Model B directory-only |
| Chicken-and-egg liquidity (no customers → no businesses → no customers) | Platform never reaches critical mass | Launch single dense neighborhood/city first, not broad-and-thin; ops-assisted merchant onboarding (Ramesh persona) rather than pure self-serve at launch |
| COD abuse / fake orders | Delivery partner and merchant trust erosion | OTP-at-delivery, order-value COD caps, customer COD-abuse scoring before GA hardening |
| Payment aggregator compliance misstep | Regulatory/legal exposure, platform shutdown risk | Use an RBI-authorized PA (Razorpay) rather than building custom settlement; legal review before payments go live |
| Low business digital literacy | Poor catalog quality, high support burden | Ops-assisted onboarding option, minimal required fields, WhatsApp-based support channel for merchants |

---

## 16. Open Decisions Requiring Stakeholder Input

### Resolved (2026-07-11)

1. ✅ **Vertical sequencing** — Model A-first / Model B-directory-plus-enquiry-at-MVP, approved as recommended (Section 6).
2. ✅ **Launch geography** — single city/neighborhood at MVP; multi-city tooling deferred to V2.
3. ✅ **Delivery execution model** — platform-recruited delivery partner fleet; Delivery Partner app is Must-have for MVP.
4. ✅ **Client platform** — native apps (React Native recommended, Section 12) for customer and delivery-partner at MVP, alongside responsive-web merchant dashboard and admin panel. *(Note: this is a larger Phase 8 build track than the originally-recommended PWA-first approach — Phase 2/8 timeline estimates should reflect two native app builds, not one responsive web app.)*

### Still Outstanding

5. **Commission rates by category** — business/finance input needed to replace placeholder ranges in Section 4/10 before Phase 10 (Deployment)/pricing goes live; not architecture-blocking.
6. **Product name** — working title only; needed before Phase 5 (UI wireframes/branding), not before Phase 2.

---

## 17. Glossary

| Term | Meaning |
|---|---|
| Model A / Product commerce | Cart-and-checkout businesses (grocery, restaurants, retail, etc.) |
| Model B / Appointment commerce | Slot/booking-based service businesses (salons, clinics, consultants, etc.) |
| WTC | Weekly Transacting Customers — North Star metric |
| PA | Payment Aggregator (RBI-regulated payment intermediary) |
| GMV | Gross Merchandise Value |
| AOV | Average Order Value |
| RBAC | Role-Based Access Control |
| DPDPA | Digital Personal Data Protection Act, 2023 (India) |

---

**Status:** Core scope decisions (Section 16, items 1–4) confirmed by stakeholder. Items 5–6 remain open but do not block Phase 2. Awaiting final sign-off to begin Phase 2 (System Architecture).
