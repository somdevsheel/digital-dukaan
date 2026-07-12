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

export type OrderPaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED" | "PARTIALLY_REFUNDED";

export interface OrderStatusHistoryRecord {
  fromStatus: OrderStatus | null;
  toStatus: OrderStatus;
  changedBy: string | null;
  note: string | null;
  createdAt: Date;
}

export interface OrderItemRecord {
  id: string;
  productVariantId: string | null;
  nameSnapshot: string;
  variantSnapshot: string | null;
  unitPriceSnapshotPaise: number;
  quantity: number;
  totalPaise: number;
}

export interface OrderRecord {
  id: string;
  orderNumber: string;
  userId: string;
  businessId: string;
  cityId: string;
  addressId: string | null;
  fulfillmentType: "DELIVERY" | "PICKUP";
  status: OrderStatus;
  subtotalPaise: number;
  taxPaise: number;
  deliveryFeePaise: number;
  platformFeePaise: number;
  discountPaise: number;
  totalPaise: number;
  paymentMethod: "ONLINE" | "COD";
  paymentStatus: OrderPaymentStatus;
  couponId: string | null;
  cancelReason: string | null;
  placedAt: Date;
  items: OrderItemRecord[];
}

export interface PlaceOrderItemInput {
  productVariantId: string;
  quantity: number;
  nameSnapshot: string;
  variantSnapshot: string | null;
  unitPriceSnapshotPaise: number;
}

export interface PlaceOrderInput {
  cartId: string;
  userId: string;
  businessId: string;
  cityId: string;
  addressId: string | null;
  fulfillmentType: "DELIVERY" | "PICKUP";
  items: PlaceOrderItemInput[];
  subtotalPaise: number;
  taxPaise: number;
  deliveryFeePaise: number;
  platformFeePaise: number;
  discountPaise: number;
  totalPaise: number;
  paymentMethod: "ONLINE" | "COD";
  couponId?: string | undefined;
  couponUserId?: string | undefined;
  discountAppliedPaise?: number | undefined;
}

export type PlaceOrderResult =
  | { success: true; order: OrderRecord }
  | { success: false; unavailableVariantIds: string[] };

export interface OrderRepository {
  /**
   * The one operation in this module that reaches directly into ProductVariant.stockQuantity
   * (Business module's table) inside its own transaction — inventory reservation and order
   * creation must be atomic (Database Design §6: prevents oversell under concurrent
   * checkout), and that atomicity can't be achieved by composing two separately-transacted
   * repository calls. Every other read of product/variant data in this module goes through
   * Business module's exported PRODUCT_REPOSITORY as normal — this is a deliberate,
   * narrow exception, the same kind already made for staff/UserRole in the Business module.
   */
  placeOrder(input: PlaceOrderInput): Promise<PlaceOrderResult>;

  findById(id: string): Promise<OrderRecord | null>;
  findByOrderNumber(orderNumber: string): Promise<OrderRecord | null>;
  listForUser(userId: string, cursor?: string, limit?: number): Promise<OrderRecord[]>;
  listForBusiness(businessId: string, status?: OrderStatus, cursor?: string, limit?: number): Promise<OrderRecord[]>;
  getStatusHistory(orderId: string): Promise<OrderStatusHistoryRecord[]>;

  transitionStatus(id: string, toStatus: OrderStatus, changedBy: string | null, note?: string): Promise<OrderRecord>;
  setPaymentStatus(id: string, status: OrderPaymentStatus): Promise<OrderRecord>;

  /** Restores stock for a cancelled/rejected order's items — the inverse of placeOrder's reservation. */
  restoreStock(orderId: string): Promise<void>;
}

export const ORDER_REPOSITORY = Symbol("ORDER_REPOSITORY");
