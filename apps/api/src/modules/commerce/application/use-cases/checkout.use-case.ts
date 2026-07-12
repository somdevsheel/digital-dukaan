import { Inject, Injectable } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { CART_REPOSITORY, type CartRepository } from "../../domain/repositories/cart.repository";
import { ORDER_REPOSITORY, type OrderRecord, type OrderRepository } from "../../domain/repositories/order.repository";
import { PRODUCT_REPOSITORY, type ProductRepository } from "../../../business/domain/repositories/product.repository";
import { BUSINESS_REPOSITORY, type BusinessRepository } from "../../../business/domain/repositories/business.repository";
import { ADDRESS_REPOSITORY, type AddressRepository } from "../../../identity/domain/repositories/address.repository";
import { CreatePaymentIntentUseCase, type PaymentIntentResult } from "../../../payments/application/use-cases/create-payment-intent.use-case";
import { ForbiddenException, NotFoundException, ValidationException } from "../../../../common/errors/app.errors";
import { BusinessNotVerifiedException } from "../../../business/domain/errors/business.errors";
import { CartNotFoundException, StockUnavailableException } from "../../domain/errors/commerce.errors";
import type { CheckoutDto } from "../dto/checkout.dto";
import { ValidateCouponUseCase } from "./validate-coupon.use-case";

// Placeholders pending business/finance calibration (PRD §16 open item on commission/fee
// rates) — a real rate-card (per-business delivery fee by distance, per-category tax
// rates) is out of scope for this pass. Kept as named constants, not magic numbers inline,
// so replacing them with a real calculation is a one-place change.
const FLAT_DELIVERY_FEE_PAISE = 2500;
const FLAT_PLATFORM_FEE_PAISE = 500;
const TAX_RATE_PERCENT = 0; // GST modeling deferred — see comment above

export interface CheckoutResult {
  order: OrderRecord;
  payment: PaymentIntentResult;
}

@Injectable()
export class CheckoutUseCase {
  constructor(
    @Inject(CART_REPOSITORY) private readonly carts: CartRepository,
    @Inject(ORDER_REPOSITORY) private readonly orders: OrderRepository,
    @Inject(PRODUCT_REPOSITORY) private readonly products: ProductRepository,
    @Inject(BUSINESS_REPOSITORY) private readonly businesses: BusinessRepository,
    @Inject(ADDRESS_REPOSITORY) private readonly addresses: AddressRepository,
    private readonly validateCoupon: ValidateCouponUseCase,
    private readonly createPaymentIntent: CreatePaymentIntentUseCase,
    private readonly events: EventEmitter2,
  ) {}

  async execute(userId: string, dto: CheckoutDto): Promise<CheckoutResult> {
    const cart = await this.carts.findActiveById(dto.cartId);
    if (!cart || cart.businessId !== dto.businessId) throw new CartNotFoundException();
    if (cart.userId !== userId) throw new ForbiddenException();
    if (cart.items.length === 0) throw new ValidationException("Cart is empty");

    const business = await this.businesses.findById(dto.businessId);
    if (!business || business.verificationStatus !== "VERIFIED") throw new BusinessNotVerifiedException();
    if (dto.fulfillmentType === "DELIVERY" && !business.deliveryEnabled) {
      throw new ValidationException("This business does not offer delivery");
    }
    if (dto.fulfillmentType === "PICKUP" && !business.pickupEnabled) {
      throw new ValidationException("This business does not offer pickup");
    }
    if (dto.paymentMethod === "COD" && !business.codEnabled) {
      throw new ValidationException("This business does not accept cash on delivery");
    }

    let addressId: string | null = null;
    if (dto.fulfillmentType === "DELIVERY") {
      if (!dto.addressId) throw new ValidationException("addressId is required for delivery orders");
      const address = await this.addresses.findById(dto.addressId);
      if (!address || address.userId !== userId) throw new NotFoundException("Address");
      addressId = address.id;
    }

    // Re-price every line against the LIVE variant, never the cart's stale snapshot
    // (API Design §5.2) — a price change between add-to-cart and checkout must charge the
    // current price, not what was true when the item was added.
    const items = await Promise.all(
      cart.items.map(async (item) => {
        const variant = await this.products.findVariantById(item.productVariantId);
        if (!variant || variant.businessId !== dto.businessId || !variant.isActive) {
          throw new StockUnavailableException([item.productVariantId]);
        }
        return {
          productVariantId: variant.id,
          quantity: item.quantity,
          nameSnapshot: variant.productName,
          variantSnapshot: variant.name,
          unitPriceSnapshotPaise: variant.pricePaise,
        };
      }),
    );

    const subtotalPaise = items.reduce((sum, i) => sum + i.unitPriceSnapshotPaise * i.quantity, 0);
    if (subtotalPaise < business.minOrderAmountPaise) {
      throw new ValidationException(
        `Minimum order amount is ₹${(business.minOrderAmountPaise / 100).toFixed(2)}`,
      );
    }

    const taxPaise = Math.round((subtotalPaise * TAX_RATE_PERCENT) / 100);
    const deliveryFeePaise = dto.fulfillmentType === "DELIVERY" ? FLAT_DELIVERY_FEE_PAISE : 0;
    const platformFeePaise = FLAT_PLATFORM_FEE_PAISE;

    let discountPaise = 0;
    let couponId: string | undefined;
    if (dto.couponCode) {
      const validation = await this.validateCoupon.execute(dto.couponCode, dto.businessId, userId, subtotalPaise);
      couponId = validation.coupon.id;
      discountPaise = validation.discountPaise;
    }

    const totalPaise = Math.max(subtotalPaise + taxPaise + deliveryFeePaise + platformFeePaise - discountPaise, 0);

    const result = await this.orders.placeOrder({
      cartId: cart.id,
      userId,
      businessId: dto.businessId,
      cityId: business.cityId,
      addressId,
      fulfillmentType: dto.fulfillmentType,
      items,
      subtotalPaise,
      taxPaise,
      deliveryFeePaise,
      platformFeePaise,
      discountPaise,
      totalPaise,
      paymentMethod: dto.paymentMethod,
      couponId,
      couponUserId: couponId ? userId : undefined,
      discountAppliedPaise: discountPaise,
    });

    if (!result.success) {
      throw new StockUnavailableException(result.unavailableVariantIds);
    }

    // Deliberately outside the order-placement transaction — see CreatePaymentIntentUseCase's
    // doc comment for why a Razorpay HTTP call must never happen inside a DB transaction.
    const payment = await this.createPaymentIntent.execute(
      result.order.id,
      result.order.orderNumber,
      result.order.totalPaise,
      dto.paymentMethod,
    );

    this.events.emit("order.placed", { orderId: result.order.id, businessId: dto.businessId, userId });
    return { order: result.order, payment };
  }
}
