# @app/web-admin

Internal ops console — verification queue, business/delivery-partner management, disputes, support tickets, RBAC, audit logs. See wireframe plates 12–14 in the [Wireframe Gallery](../../docs/05-ui-wireframes/wireframe-gallery.html) and `/admin/*` routes in [API Design §4.9](../../docs/04-api-design/API_DESIGN.md#49-admin).

Every mutating action here is RBAC-gated server-side (Architecture §9) — the UI hiding a button is a UX nicety, not the security boundary.

## Status

Scaffolded (Phase 6). Implementation begins Phase 8.
