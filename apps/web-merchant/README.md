# @app/web-merchant

Merchant dashboard — the desk-bound, data-dense surface for store setup, catalog/inventory, order fulfillment, coupons, staff, and sales analytics. See wireframe plates 08–11 in the [Wireframe Gallery](../../docs/05-ui-wireframes/wireframe-gallery.html) and the `/merchant/*` routes in [API Design §4.7](../../docs/04-api-design/API_DESIGN.md#47-merchant-dashboard).

## Status

Scaffolded (Phase 6). Visual design + implementation begins Phase 8, built on the validated Phase 5 layouts using Shadcn UI + Tailwind (Architecture, tech stack).

## Structure (populated in Phase 8)

```
src/
  app/                # Next.js App Router
    (dashboard)/
      businesses/[id]/
        products/
        orders/
        coupons/
        staff/
        analytics/
  components/
  lib/
```
