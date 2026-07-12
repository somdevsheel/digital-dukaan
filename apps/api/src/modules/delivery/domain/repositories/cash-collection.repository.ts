export type CashCollectionStatus = "PENDING" | "COLLECTED" | "REMITTED" | "RECONCILED";

export interface CashCollectionRecord {
  id: string;
  orderId: string;
  deliveryPartnerId: string;
  amountPaise: number;
  status: CashCollectionStatus;
}

export interface CashCollectionRepository {
  createForOrder(orderId: string, deliveryPartnerId: string, amountPaise: number): Promise<CashCollectionRecord>;
  markCollected(orderId: string): Promise<void>;
  getPendingRemittanceTotal(deliveryPartnerId: string): Promise<number>;
}

export const CASH_COLLECTION_REPOSITORY = Symbol("CASH_COLLECTION_REPOSITORY");
