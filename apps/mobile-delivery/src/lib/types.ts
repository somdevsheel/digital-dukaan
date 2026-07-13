export type VehicleType = "BIKE" | "BICYCLE" | "ON_FOOT" | "VAN";

export interface DeliveryPartner {
  id: string;
  userId: string;
  cityId: string;
  vehicleType: VehicleType;
  vehicleNumber: string | null;
  verificationStatus: "PENDING" | "VERIFIED" | "REJECTED" | "SUSPENDED";
  isAvailable: boolean;
  ratingAvg: number;
}

export interface City {
  id: string;
  name: string;
  state: string;
}

export interface DeliveryOffer {
  deliveryId: string;
  orderId: string;
  businessName: string;
  pickupAddress: string;
  distanceMeters: number;
  estimatedEarningsPaise: number;
}

export type DeliveryStatus = "UNASSIGNED" | "ASSIGNED" | "PICKED_UP" | "OUT_FOR_DELIVERY" | "DELIVERED" | "FAILED";

export interface DeliveryRecord {
  id: string;
  orderId: string;
  deliveryPartnerId: string | null;
  status: DeliveryStatus;
  assignedAt: string | null;
  pickedUpAt: string | null;
  deliveredAt: string | null;
  distanceMeters: number | null;
  earningsPaise: number | null;
}

export interface DeliveryEarning {
  id: string;
  deliveryId: string | null;
  type: "DELIVERY_FEE" | "INCENTIVE" | "DEDUCTION";
  amountPaise: number;
  status: "PENDING" | "PAID";
  createdAt: string;
}

export interface Wallet {
  availableBalancePaise: number;
  cashToRemitPaise: number;
}
