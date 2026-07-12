export interface CartItemRecord {
  id: string;
  productVariantId: string;
  quantity: number;
  priceSnapshotPaise: number;
}

export interface CartRecord {
  id: string;
  userId: string;
  businessId: string;
  status: "ACTIVE" | "CONVERTED" | "ABANDONED";
  items: CartItemRecord[];
}

export interface CartRepository {
  getOrCreateActive(userId: string, businessId: string): Promise<CartRecord>;
  findActiveById(cartId: string): Promise<CartRecord | null>;
  addItem(cartId: string, productVariantId: string, quantity: number, priceSnapshotPaise: number): Promise<CartRecord>;
  updateItemQuantity(cartId: string, itemId: string, quantity: number): Promise<CartRecord>;
  removeItem(cartId: string, itemId: string): Promise<CartRecord>;
  markConverted(cartId: string): Promise<void>;
}

export const CART_REPOSITORY = Symbol("CART_REPOSITORY");
