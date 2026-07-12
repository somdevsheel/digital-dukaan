export type BusinessMediaType = "LOGO" | "BANNER" | "GALLERY";

export interface BusinessMediaRecord {
  id: string;
  businessId: string;
  type: BusinessMediaType;
  url: string;
  sortOrder: number;
}

export interface BusinessMediaRepository {
  listForBusiness(businessId: string): Promise<BusinessMediaRecord[]>;
  add(businessId: string, type: BusinessMediaType, url: string, sortOrder: number): Promise<BusinessMediaRecord>;
  remove(id: string): Promise<void>;
}

export const BUSINESS_MEDIA_REPOSITORY = Symbol("BUSINESS_MEDIA_REPOSITORY");
