export interface BusinessBankDetailRecord {
  id: string;
  businessId: string;
  accountHolderName: string;
  ifsc: string;
  upiId: string | null;
  verifiedAt: Date | null;
  createdAt: Date;
}

export interface UpsertBankDetailInput {
  accountHolderName: string;
  /** Already encrypted by the caller (application layer, via FieldEncryptionPort) — this
   *  repository persists it as-is and never sees the plaintext account number. */
  accountNumberEncrypted: string;
  ifsc: string;
  upiId?: string | undefined;
}

/**
 * Port — bank details are historized (a new row per change, never edited in place, per
 * Database Design §3), so "get current" always means "most recent row for this business."
 */
export interface BusinessBankDetailRepository {
  getCurrent(businessId: string): Promise<BusinessBankDetailRecord | null>;
  add(businessId: string, input: UpsertBankDetailInput): Promise<BusinessBankDetailRecord>;
}

export const BUSINESS_BANK_DETAIL_REPOSITORY = Symbol("BUSINESS_BANK_DETAIL_REPOSITORY");
