import { Inject, Injectable } from "@nestjs/common";
import {
  COUPON_REPOSITORY,
  type CouponRecord,
  type CouponRepository,
} from "../../domain/repositories/coupon.repository";
import { ForbiddenException, NotFoundException } from "../../../../common/errors/app.errors";
import type { CreateCouponDto, UpdateCouponDto } from "../dto/coupon.dto";

@Injectable()
export class MerchantCouponUseCase {
  constructor(@Inject(COUPON_REPOSITORY) private readonly coupons: CouponRepository) {}

  list(businessId: string): Promise<CouponRecord[]> {
    return this.coupons.listForBusiness(businessId);
  }

  create(businessId: string, dto: CreateCouponDto): Promise<CouponRecord> {
    return this.coupons.create(businessId, {
      code: dto.code.toUpperCase(),
      type: dto.type,
      value: dto.value,
      startsAt: new Date(dto.startsAt),
      expiresAt: new Date(dto.expiresAt),
      minOrderAmountPaise: dto.minOrderAmountPaise,
      maxDiscountPaise: dto.maxDiscountPaise,
      usageLimit: dto.usageLimit,
      perUserLimit: dto.perUserLimit,
    });
  }

  async update(businessId: string, couponId: string, dto: UpdateCouponDto): Promise<CouponRecord> {
    const existing = await this.coupons.findById(couponId);
    if (!existing) throw new NotFoundException("Coupon");
    if (existing.businessId !== businessId) throw new ForbiddenException();

    return this.coupons.update(couponId, {
      ...(dto.code !== undefined ? { code: dto.code.toUpperCase() } : {}),
      ...(dto.type !== undefined ? { type: dto.type } : {}),
      ...(dto.value !== undefined ? { value: dto.value } : {}),
      ...(dto.startsAt !== undefined ? { startsAt: new Date(dto.startsAt) } : {}),
      ...(dto.expiresAt !== undefined ? { expiresAt: new Date(dto.expiresAt) } : {}),
      minOrderAmountPaise: dto.minOrderAmountPaise,
      maxDiscountPaise: dto.maxDiscountPaise,
      usageLimit: dto.usageLimit,
      perUserLimit: dto.perUserLimit,
      isActive: dto.isActive,
    });
  }
}
