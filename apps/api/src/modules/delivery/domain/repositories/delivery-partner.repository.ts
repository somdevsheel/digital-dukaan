export type VehicleType = "BIKE" | "BICYCLE" | "ON_FOOT" | "VAN";
export type VerificationStatus = "PENDING" | "VERIFIED" | "REJECTED" | "SUSPENDED";

export interface DeliveryPartnerRecord {
  id: string;
  userId: string;
  cityId: string;
  vehicleType: VehicleType;
  vehicleNumber: string | null;
  verificationStatus: VerificationStatus;
  isAvailable: boolean;
  currentLatitude: number | null;
  currentLongitude: number | null;
  ratingAvg: number;
}

export interface RegisterDeliveryPartnerInput {
  cityId: string;
  vehicleType: VehicleType;
  vehicleNumber?: string | undefined;
}

export interface DeliveryPartnerRepository {
  register(userId: string, input: RegisterDeliveryPartnerInput): Promise<DeliveryPartnerRecord>;
  findById(id: string): Promise<DeliveryPartnerRecord | null>;
  findByUserId(userId: string): Promise<DeliveryPartnerRecord | null>;
  setAvailability(id: string, isAvailable: boolean): Promise<DeliveryPartnerRecord>;
  updateLocation(id: string, latitude: number, longitude: number): Promise<void>;
}

export const DELIVERY_PARTNER_REPOSITORY = Symbol("DELIVERY_PARTNER_REPOSITORY");
