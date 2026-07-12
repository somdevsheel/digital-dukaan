export type DeliveryEarningType = "DELIVERY_FEE" | "INCENTIVE" | "DEDUCTION";

export interface DeliveryEarningRecord {
  id: string;
  deliveryPartnerId: string;
  deliveryId: string | null;
  type: DeliveryEarningType;
  amountPaise: number;
  status: "PENDING" | "PAID";
  createdAt: Date;
}

/**
 * Port — append-only ledger (Database Design §4.1), same principle as PaymentTransaction:
 * balance is always SUM(), never a stored column. Sign convention: DELIVERY_FEE/INCENTIVE
 * are recorded with a positive amountPaise, DEDUCTION with a negative one — this is what
 * lets getAvailableBalance's SUM() net everything out correctly without a CASE/type switch.
 */
export interface DeliveryEarningRepository {
  /** `amountPaise` sign must match the convention above — callers pass a negative value for DEDUCTION. */
  credit(deliveryPartnerId: string, deliveryId: string | null, type: DeliveryEarningType, amountPaise: number): Promise<DeliveryEarningRecord>;
  listForPartner(deliveryPartnerId: string, cursor?: string, limit?: number): Promise<DeliveryEarningRecord[]>;
  getAvailableBalance(deliveryPartnerId: string): Promise<number>;
}

export const DELIVERY_EARNING_REPOSITORY = Symbol("DELIVERY_EARNING_REPOSITORY");
