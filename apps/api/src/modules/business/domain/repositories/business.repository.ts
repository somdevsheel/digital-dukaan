export type VerificationStatus = "PENDING" | "VERIFIED" | "REJECTED" | "SUSPENDED";

export interface BusinessRecord {
  id: string;
  ownerUserId: string;
  businessTypeId: string;
  cityId: string;
  name: string;
  slug: string;
  description: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  gstNumber: string | null;
  panNumber: string | null;
  fssaiNumber: string | null;
  verificationStatus: VerificationStatus;
  verifiedAt: Date | null;
  addressLine: string;
  pinCode: string;
  latitude: number;
  longitude: number;
  deliveryRadiusMeters: number | null;
  minOrderAmountPaise: number;
  avgPrepTimeMinutes: number | null;
  pickupEnabled: boolean;
  deliveryEnabled: boolean;
  codEnabled: boolean;
  isOpen: boolean;
  commissionRatePercent: number;
  createdAt: Date;
}

export interface CreateBusinessInput {
  ownerUserId: string;
  businessTypeId: string;
  cityId: string;
  name: string;
  slug: string;
  description?: string;
  addressLine: string;
  pinCode: string;
  latitude: number;
  longitude: number;
  minOrderAmountPaise?: number;
}

export type UpdateBusinessInput = Partial<
  Omit<CreateBusinessInput, "ownerUserId" | "businessTypeId" | "cityId" | "slug">
> & {
  logoUrl?: string;
  bannerUrl?: string;
  gstNumber?: string;
  panNumber?: string;
  fssaiNumber?: string;
  deliveryRadiusMeters?: number;
  avgPrepTimeMinutes?: number;
  pickupEnabled?: boolean;
  deliveryEnabled?: boolean;
  codEnabled?: boolean;
  isOpen?: boolean;
};

export interface BusinessListFilters {
  status?: VerificationStatus | undefined;
  cityId?: string | undefined;
  businessTypeId?: string | undefined;
}

export interface BusinessRepository {
  findById(id: string): Promise<BusinessRecord | null>;
  findBySlug(slug: string): Promise<BusinessRecord | null>;
  slugExists(slug: string): Promise<boolean>;
  create(input: CreateBusinessInput): Promise<BusinessRecord>;
  update(id: string, input: UpdateBusinessInput): Promise<BusinessRecord>;
  setVerificationStatus(id: string, status: VerificationStatus): Promise<BusinessRecord>;
  listByVerificationStatus(status: VerificationStatus, cursor?: string, limit?: number): Promise<BusinessRecord[]>;
  /** Unfiltered (or partially filtered) admin listing — Business Management (plate 13), unlike
   *  listByVerificationStatus which always requires a single status (Verification Queue, plate 12). */
  listAll(filters: BusinessListFilters, cursor?: string, limit?: number): Promise<BusinessRecord[]>;
  count(filters: BusinessListFilters): Promise<number>;
}

export const BUSINESS_REPOSITORY = Symbol("BUSINESS_REPOSITORY");
