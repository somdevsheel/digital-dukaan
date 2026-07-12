# @app/realtime

Socket.IO gateway. **The Redis adapter is mandatory from the first commit** — without it, events emitted from one pod never reach a client connected to another, which only surfaces once this service scales past one replica (Architecture §14). Rooms: `order:{orderId}`, `delivery:{partnerId}`, `business:{businessId}` — see [API Design §7](../../docs/04-api-design/API_DESIGN.md#7-realtime-events-non-rest) for the event catalog.

## Status

Scaffolded (Phase 6). Implementation begins Phase 7.
