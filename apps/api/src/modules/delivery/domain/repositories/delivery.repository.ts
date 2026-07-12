export type DeliveryStatus = "UNASSIGNED" | "ASSIGNED" | "PICKED_UP" | "OUT_FOR_DELIVERY" | "DELIVERED" | "FAILED";

export interface DeliveryRecord {
  id: string;
  orderId: string;
  deliveryPartnerId: string | null;
  status: DeliveryStatus;
  assignedAt: Date | null;
  pickedUpAt: Date | null;
  deliveredAt: Date | null;
  distanceMeters: number | null;
  earningsPaise: number | null;
}

export interface DeliveryOffer {
  deliveryId: string;
  orderId: string;
  businessName: string;
  pickupAddress: string;
  distanceMeters: number;
  estimatedEarningsPaise: number;
}

/**
 * Port. `assign` uses a conditional atomic UPDATE (`WHERE status = 'UNASSIGNED'`), the same
 * pattern as Business module's stock-decrement — deliberately **not** the Redis `SET NX`
 * lock Architecture §15 originally sketched for this exact race (two partners tapping
 * Accept simultaneously). Postgres row-level locking during a single conditional UPDATE
 * already guarantees exactly one caller's write succeeds; a Redis lock would add
 * acquire/release/expiry semantics for a guarantee the database gives for free. Worth
 * revisiting only if this table is ever sharded out of Postgres — not currently planned.
 */
export interface DeliveryRepository {
  createForOrder(orderId: string): Promise<DeliveryRecord>;
  findById(id: string): Promise<DeliveryRecord | null>;
  findByOrderId(orderId: string): Promise<DeliveryRecord | null>;
  listOffersNear(latitude: number, longitude: number, radiusMeters: number): Promise<DeliveryOffer[]>;

  /** Returns false if another partner already won the race — caller maps that to a 409. */
  assign(deliveryId: string, deliveryPartnerId: string): Promise<boolean>;

  markPickedUp(deliveryId: string, otpHash: string): Promise<DeliveryRecord>;
  /**
   * Returns the stored Argon2 hash so the use case can call PasswordHasherPort.verify() —
   * Argon2 is salted/non-deterministic, so "hash the provided OTP and compare strings"
   * (which a naive version of this port originally did) is simply wrong; verification
   * must go through the hasher, never a repository-side string comparison.
   */
  getOtpHash(deliveryId: string): Promise<string | null>;
  markDelivered(deliveryId: string, earningsPaise: number): Promise<DeliveryRecord>;

  listForPartner(deliveryPartnerId: string, cursor?: string, limit?: number): Promise<DeliveryRecord[]>;
}

export const DELIVERY_REPOSITORY = Symbol("DELIVERY_REPOSITORY");
