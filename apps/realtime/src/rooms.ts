import type { PermissionGrant } from "./events";

export type RoomKind = "order" | "delivery" | "business";

export interface ParsedRoom {
  kind: RoomKind;
  id: string;
}

// UUIDs in this schema (see prisma/schema.prisma: @default(dbgenerated("gen_random_uuid()")))
// but kept a bit looser than a strict UUID regex so this doesn't silently break if an id
// format ever changes — it only needs to reject obviously-malformed room names.
const ROOM_PATTERN = /^(order|delivery|business):([a-zA-Z0-9-]{1,64})$/;

export function parseRoom(room: string): ParsedRoom | null {
  const match = ROOM_PATTERN.exec(room);
  if (!match) return null;
  const kind = match[1];
  const id = match[2];
  if (!kind || !id) return null;
  return { kind: kind as RoomKind, id };
}

export function orderRoom(orderId: string): string {
  return `order:${orderId}`;
}

export function deliveryRoom(partnerId: string): string {
  return `delivery:${partnerId}`;
}

export function businessRoom(businessId: string): string {
  return `business:${businessId}`;
}

/**
 * Room-join authorization — a documented architectural gap (Architecture §14 names the
 * three rooms and says joins are "authorized against the same JWT used for REST" but
 * doesn't spell out the mechanics, and this service deliberately has no DB access, per
 * Architecture §3/§14: it's a pure event relay). Two different trust levels result:
 *
 * - `business:{id}` IS cryptographically authorized. The JWT's `grants` array is the
 *   exact shape/values apps/api's PermissionGuard checks (common/types/authenticated-user.ts,
 *   common/guards/permission.guard.ts), baked into the token at issuance: a grant with
 *   businessId === null is a platform-wide admin grant (matches any business, mirroring
 *   PermissionGuard's own admin-catchall), and a grant with businessId === id means this
 *   user holds *some* staff permission for that business. That's an honest, DB-free
 *   authorization check because business scoping already lives inside the token.
 *
 * - `order:{id}` and `delivery:{id}` are NOT cryptographically authorized against actual
 *   resource ownership — this service has no way to ask "does order <id> belong to this
 *   user" without a DB. Any holder of a valid, non-expired access token may join, provided
 *   they know the exact UUID. This is a deliberate "capability URL" trade-off (the same
 *   model Uber/Swiggy-style tracking links use): order and delivery-partner ids are
 *   non-enumerable UUIDs the REST API only ever *hands* to the customer/partner who owns
 *   that resource (GET /orders/:id/track, GET /delivery-partners/me, etc.), so "knows the
 *   id" + "has a valid platform login" is treated as adequate proof for a chat/location
 *   relay room — NOT for anything financially sensitive, which this service never carries.
 *   A real fix (out of scope here) would have the API mint a short-lived signed "room
 *   ticket" claim (e.g. `{ sub, room, exp: +60s }`) alongside the tracking/offer response,
 *   which this service would verify instead of trusting bare identity + a guessed id.
 */
export function authorizeJoin(room: ParsedRoom, grants: PermissionGrant[]): boolean {
  if (room.kind === "business") {
    return grants.some((grant) => grant.businessId === null || grant.businessId === room.id);
  }
  return true;
}
