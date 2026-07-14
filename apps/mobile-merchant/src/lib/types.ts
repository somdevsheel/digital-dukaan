export interface Business {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  addressLine: string;
  pinCode: string;
  latitude: number;
  longitude: number;
  verificationStatus: "PENDING" | "VERIFIED" | "REJECTED" | "SUSPENDED";
  pickupEnabled: boolean;
  deliveryEnabled: boolean;
  codEnabled: boolean;
  isOpen: boolean;
  minOrderAmountPaise: number;
}

export interface BusinessType {
  id: string;
  name: string;
  commerceModel: "PRODUCT" | "SERVICE";
}

export interface City {
  id: string;
  name: string;
  state: string;
}

export interface Category {
  id: string;
  parentId: string | null;
  name: string;
  appliesTo: "PRODUCT" | "SERVICE";
  isActive: boolean;
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
  categoryId: string | null;
  name: string;
  basePricePaise: number;
  isActive: boolean;
  variants: ProductVariant[];
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
  quantity: number;
  totalPaise: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  fulfillmentType: "DELIVERY" | "PICKUP";
  totalPaise: number;
  items: OrderItem[];
}

export interface Coupon {
  id: string;
  code: string;
  type: "PERCENT" | "FLAT";
  value: number;
  expiresAt: string;
  isActive: boolean;
}

export interface StaffMember {
  userRoleId: string;
  userFullName: string | null;
  userEmail: string | null;
  roleName: string;
}

export type SalesRange = "today" | "week" | "month";

export interface SalesSummary {
  revenuePaise: number;
  orderCount: number;
  newCustomerCount: number;
  trend: { date: string; revenuePaise: number }[];
}
