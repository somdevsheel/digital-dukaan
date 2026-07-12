import { Inject, Injectable } from "@nestjs/common";
import { CART_REPOSITORY, type CartRecord, type CartRepository } from "../../domain/repositories/cart.repository";
import { PRODUCT_REPOSITORY, type ProductRepository } from "../../../business/domain/repositories/product.repository";
import { ForbiddenException, NotFoundException } from "../../../../common/errors/app.errors";
import { CartNotFoundException } from "../../domain/errors/commerce.errors";
import { ValidateCouponUseCase, type CouponValidationResult } from "./validate-coupon.use-case";

@Injectable()
export class CartUseCase {
  constructor(
    @Inject(CART_REPOSITORY) private readonly carts: CartRepository,
    @Inject(PRODUCT_REPOSITORY) private readonly products: ProductRepository,
    private readonly validateCoupon: ValidateCouponUseCase,
  ) {}

  getOrCreate(userId: string, businessId: string): Promise<CartRecord> {
    return this.carts.getOrCreateActive(userId, businessId);
  }

  async addItem(userId: string, businessId: string, productVariantId: string, quantity: number): Promise<CartRecord> {
    const variant = await this.products.findVariantById(productVariantId);
    if (!variant || variant.businessId !== businessId) {
      throw new NotFoundException("Product variant");
    }
    const cart = await this.carts.getOrCreateActive(userId, businessId);
    // Price is snapshotted into the cart item at add-time — checkout still recomputes
    // against the live variant price regardless (API Design §5.2), this snapshot is only
    // what the cart UI displays before checkout, not the source of truth for charging.
    return this.carts.addItem(cart.id, productVariantId, quantity, variant.pricePaise);
  }

  async updateItemQuantity(userId: string, cartId: string, itemId: string, quantity: number): Promise<CartRecord> {
    await this.assertOwned(userId, cartId);
    return this.carts.updateItemQuantity(cartId, itemId, quantity);
  }

  async removeItem(userId: string, cartId: string, itemId: string): Promise<CartRecord> {
    await this.assertOwned(userId, cartId);
    return this.carts.removeItem(cartId, itemId);
  }

  /**
   * Preview only — validates the coupon and shows what discount would apply, but never
   * writes a CouponRedemption row. Uses the cart's snapshotted prices (not a live re-price
   * pass) since this is a UI hint; checkout is what recomputes and commits authoritatively.
   */
  async previewCoupon(userId: string, businessId: string, code: string): Promise<CouponValidationResult> {
    const cart = await this.carts.getOrCreateActive(userId, businessId);
    const subtotalPaise = cart.items.reduce((sum, i) => sum + i.priceSnapshotPaise * i.quantity, 0);
    return this.validateCoupon.execute(code, businessId, userId, subtotalPaise);
  }

  private async assertOwned(userId: string, cartId: string): Promise<CartRecord> {
    const cart = await this.carts.findActiveById(cartId);
    if (!cart) throw new CartNotFoundException();
    if (cart.userId !== userId) throw new ForbiddenException();
    return cart;
  }
}
