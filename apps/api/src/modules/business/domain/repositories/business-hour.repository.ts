export interface BusinessHourRecord {
  dayOfWeek: number; // 0=Sunday .. 6=Saturday
  openTime: string | null;
  closeTime: string | null;
  isClosed: boolean;
}

/** Port — always replaced as a full week at once (the merchant's "Store Timing" form submits all 7 days together). */
export interface BusinessHourRepository {
  listForBusiness(businessId: string): Promise<BusinessHourRecord[]>;
  replaceWeek(businessId: string, hours: BusinessHourRecord[]): Promise<BusinessHourRecord[]>;
}

export const BUSINESS_HOUR_REPOSITORY = Symbol("BUSINESS_HOUR_REPOSITORY");
