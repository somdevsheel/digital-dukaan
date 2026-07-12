export type PaymentTransactionType = "PAYMENT" | "REFUND" | "ADJUSTMENT";
export type PaymentProvider = "RAZORPAY" | "STRIPE" | "COD";
export type PaymentTransactionStatus = "PENDING" | "SUCCESS" | "FAILED";

export interface PaymentTransactionRecord {
  id: string;
  orderId: string | null;
  type: PaymentTransactionType;
  amountPaise: number;
  provider: PaymentProvider;
  providerRefId: string | null;
  status: PaymentTransactionStatus;
  createdAt: Date;
}

export interface CreatePaymentTransactionInput {
  orderId: string;
  type: PaymentTransactionType;
  amountPaise: number;
  provider: PaymentProvider;
  providerRefId?: string | undefined;
  status: PaymentTransactionStatus;
  rawPayload?: unknown;
}

/**
 * Port — append-only ledger (Database Design §4.1). No `update` method for mutating an
 * existing row's amount — only `updateStatus` for the one legitimate lifecycle change
 * (PENDING -> SUCCESS/FAILED as the gateway confirms), and `sumForOrder` for deriving a
 * balance, never a stored running total.
 */
export interface PaymentTransactionRepository {
  create(input: CreatePaymentTransactionInput): Promise<PaymentTransactionRecord>;
  findByProviderRefId(providerRefId: string): Promise<PaymentTransactionRecord | null>;
  updateStatus(id: string, status: PaymentTransactionStatus): Promise<PaymentTransactionRecord>;
  listForOrder(orderId: string): Promise<PaymentTransactionRecord[]>;
}

export const PAYMENT_TRANSACTION_REPOSITORY = Symbol("PAYMENT_TRANSACTION_REPOSITORY");
