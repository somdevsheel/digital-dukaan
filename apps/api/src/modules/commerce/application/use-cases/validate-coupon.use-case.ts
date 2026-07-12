import { Inject, Injectable } from "@nestjs/common";
import { COUPON_REPOSITORY, type CouponRecord, type CouponRepository } from "../../domain/repositories/coupon.repository";
import { InvalidCouponException } from "../../domain/errors/commerce.errors";

export interface CouponValidationResult {
  coupon: CouponRecord;
  discountPaise: number;
}

/**
 * Shared by the cart's apply-coupon *preview* (CartUseCase) and checkout's *commit*
 * (CheckoutUseCase) — same rules, same discount math, so they can never silently drift
 * apart (e.g. cart says "10% off" but checkout computes a different number). Preview never
 * writes a CouponRedemption row; only a placed order does that (Database Design §4.7).
 */
@Injectable()
export class ValidateCouponUseCase {
  constructor(@Inject(COUPON_REPOSITORY) private readonly coupons: CouponRepository) {}

  async execute(code: string, businessId: string, userId: string, subtotalPaise: number): Promise<CouponValidationResult> {
    const coupon = await this.coupons.findByCode(code, businessId);
    if (!coupon || !coupon.isActive) throw new InvalidCouponException("Invalid coupon code");

    const now = new Date();
    if (now < coupon.startsAt || now > coupon.expiresAt) {
      throw new InvalidCouponException("This coupon is not currently valid");
    }
    if (coupon.minOrderAmountPaise && subtotalPaise < coupon.minOrderAmountPaise) {
      throw new InvalidCouponException(`This coupon requires a minimum order of ₹${(coupon.minOrderAmountPaise / 100).toFixed(2)}`);
    }
    if (coupon.usageLimit !== null) {
      const totalUses = await this.coupons.countTotalRedemptions(coupon.id);
      if (totalUses >= coupon.usageLimit) throw new InvalidCouponException("This coupon has reached its usage limit");
    }
    if (coupon.perUserLimit !== null) {
      const userUses = await this.coupons.countUserRedemptions(coupon.id, userId);
      if (userUses >= coupon.perUserLimit) throw new InvalidCouponException("You've already used this coupon the maximum number of times");
    }

    const discountPaise =
      coupon.type === "PERCENT"
        ? Math.min(Math.round((subtotalPaise * coupon.value) / 100), coupon.maxDiscountPaise ?? Infinity)
        : Math.min(coupon.value, subtotalPaise);

    return { coupon, discountPaise };
  }
}
