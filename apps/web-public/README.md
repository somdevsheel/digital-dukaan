# @app/web-public

Server-rendered, search-engine-indexable business/city/category pages — the recommended addition from [Architecture §4](../../docs/02-architecture/ARCHITECTURE.md#4-client-applications). Read-only; any transactional action (cart, checkout, booking) deep-links to the native Customer app rather than reimplementing commerce here.

## Status

Scaffolded (Phase 6). Flagged as optional in Architecture §4/§25 — cut this app if the product decision changes; nothing else in the monorepo depends on it.
