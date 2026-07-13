export interface BusinessType {
  id: string;
  name: string;
  commerceModel: "PRODUCT" | "SERVICE";
  icon: string | null;
  sortOrder: number;
}

export interface City {
  id: string;
  name: string;
  state: string;
  isActive: boolean;
}

export interface BusinessSearchHit {
  id: string;
  slug: string;
  name: string;
  businessTypeName: string;
  logoUrl: string | null;
  ratingAvg: number;
  distanceMeters: number | null;
  isOpen: boolean;
  deliveryEnabled: boolean;
  pickupEnabled: boolean;
  verificationStatus: string;
}

export interface BusinessSearchResult {
  hits: BusinessSearchHit[];
  nextCursor: string | null;
}

export interface Business {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  verificationStatus: "PENDING" | "VERIFIED" | "REJECTED" | "SUSPENDED";
  addressLine: string;
  pinCode: string;
  latitude: number;
  longitude: number;
  minOrderAmountPaise: number;
  pickupEnabled: boolean;
  deliveryEnabled: boolean;
  codEnabled: boolean;
  isOpen: boolean;
}

export interface ProductVariant {
  id: string;
  name: string;
  pricePaise: number;
  stockQuantity: number;
  isActive: boolean;
}

export interface Product {
  id: string;
  businessId: string;
  categoryId: string | null;
  name: string;
  description: string | null;
  basePricePaise: number;
  isActive: boolean;
  variants: ProductVariant[];
  images: { id: string; url: string; sortOrder: number }[];
}

export interface ServiceItem {
  id: string;
  businessId: string;
  name: string;
  description: string | null;
  pricePaise: number;
  durationMinutes: number | null;
  isActive: boolean;
  images: { id: string; url: string; sortOrder: number }[];
}

export interface Review {
  id: string;
  rating: number;
  comment: string | null;
  reply: { message: string; createdAt: string } | null;
  createdAt: string;
}

export interface CartItem {
  id: string;
  productVariantId: string;
  quantity: number;
  priceSnapshotPaise: number;
}

export interface Cart {
  id: string;
  userId: string;
  businessId: string;
  status: "ACTIVE" | "CONVERTED" | "ABANDONED";
  items: CartItem[];
}

export type OrderStatus =
  | "PLACED"
  | "ACCEPTED"
  | "REJECTED"
  | "PACKING"
  | "READY"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "COMPLETED"
  | "CANCELLED";

export interface OrderItem {
  id: string;
  nameSnapshot: string;
  variantSnapshot: string | null;
  unitPriceSnapshotPaise: number;
  quantity: number;
  totalPaise: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  businessId: string;
  addressId: string | null;
  fulfillmentType: "DELIVERY" | "PICKUP";
  status: OrderStatus;
  subtotalPaise: number;
  taxPaise: number;
  deliveryFeePaise: number;
  platformFeePaise: number;
  discountPaise: number;
  totalPaise: number;
  cancelReason: string | null;
  paymentMethod: "ONLINE" | "COD";
  paymentStatus: "PENDING" | "PAID" | "FAILED" | "REFUNDED" | "PARTIALLY_REFUNDED";
  items: OrderItem[];
  placedAt: string;
}

export interface OrderStatusHistoryEntry {
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus;
  note: string | null;
  createdAt: string;
}

export interface Address {
  id: string;
  label: string;
  line1: string;
  line2: string | null;
  landmark: string | null;
  city: string;
  state: string;
  pinCode: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;
}

// Pickup orders resolve to a merchant-marked COMPLETED instead of a delivery handoff (see
// web-merchant's order queue, which is fulfillment-aware the same way) — so the tracker
// shows a different step list per fulfillment type rather than one that's half-dead for pickup.
export function orderSteps(fulfillmentType: "DELIVERY" | "PICKUP"): { status: OrderStatus; label: string }[] {
  const steps =
    fulfillmentType === "PICKUP"
      ? ([
          { status: "PLACED", label: "Placed" },
          { status: "ACCEPTED", label: "Accepted" },
          { status: "PACKING", label: "Packing" },
          { status: "READY", label: "Ready" },
          { status: "COMPLETED", label: "Picked up" },
        ] as const)
      : ([
          { status: "PLACED", label: "Placed" },
          { status: "ACCEPTED", label: "Accepted" },
          { status: "PACKING", label: "Packing" },
          { status: "OUT_FOR_DELIVERY", label: "Out for delivery" },
          { status: "DELIVERED", label: "Delivered" },
        ] as const);
  return steps.map((s) => ({ status: s.status, label: s.label }));
}
