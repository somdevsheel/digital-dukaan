import { Injectable } from "@nestjs/common";
import type { Coupon } from "@prisma/client";
import { PrismaService } from "../../../../common/prisma/prisma.service";
import type {
  CouponRecord,
  CouponRepository,
  CreateCouponInput,
  UpdateCouponInput,
} from "../../domain/repositories/coupon.repository";

@Injectable()
export class PrismaCouponRepository implements CouponRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByCode(code: string, businessId: string): Promise<CouponRecord | null> {
    // A coupon is either platform-wide (businessId null) or scoped to this specific
    // business — never matches a different business's coupon code (Database Design §3).
    const coupon = await this.prisma.coupon.findFirst({
      where: { code, OR: [{ businessId: null }, { businessId }] },
    });
    return coupon ? this.toRecord(coupon) : null;
  }

  async countTotalRedemptions(couponId: string): Promise<number> {
    return this.prisma.couponRedemption.count({ where: { couponId } });
  }

  async countUserRedemptions(couponId: string, userId: string): Promise<number> {
    return this.prisma.couponRedemption.count({ where: { couponId, userId } });
  }

  async findById(id: string): Promise<CouponRecord | null> {
    const coupon = await this.prisma.coupon.findUnique({ where: { id } });
    return coupon ? this.toRecord(coupon) : null;
  }

  async listForBusiness(businessId: string): Promise<CouponRecord[]> {
    const coupons = await this.prisma.coupon.findMany({ where: { businessId }, orderBy: { startsAt: "desc" } });
    return coupons.map((c) => this.toRecord(c));
  }

  async create(businessId: string, input: CreateCouponInput): Promise<CouponRecord> {
    const coupon = await this.prisma.coupon.create({
      data: {
        businessId,
        code: input.code,
        type: input.type,
        value: input.value,
        startsAt: input.startsAt,
        expiresAt: input.expiresAt,
        ...(input.minOrderAmountPaise !== undefined ? { minOrderAmountPaise: input.minOrderAmountPaise } : {}),
        ...(input.maxDiscountPaise !== undefined ? { maxDiscountPaise: input.maxDiscountPaise } : {}),
        ...(input.usageLimit !== undefined ? { usageLimit: input.usageLimit } : {}),
        ...(input.perUserLimit !== undefined ? { perUserLimit: input.perUserLimit } : {}),
      },
    });
    return this.toRecord(coupon);
  }

  async update(id: string, input: UpdateCouponInput): Promise<CouponRecord> {
    const coupon = await this.prisma.coupon.update({
      where: { id },
      data: {
        ...(input.code !== undefined ? { code: input.code } : {}),
        ...(input.type !== undefined ? { type: input.type } : {}),
        ...(input.value !== undefined ? { value: input.value } : {}),
        ...(input.startsAt !== undefined ? { startsAt: input.startsAt } : {}),
        ...(input.expiresAt !== undefined ? { expiresAt: input.expiresAt } : {}),
        ...(input.minOrderAmountPaise !== undefined ? { minOrderAmountPaise: input.minOrderAmountPaise } : {}),
        ...(input.maxDiscountPaise !== undefined ? { maxDiscountPaise: input.maxDiscountPaise } : {}),
        ...(input.usageLimit !== undefined ? { usageLimit: input.usageLimit } : {}),
        ...(input.perUserLimit !== undefined ? { perUserLimit: input.perUserLimit } : {}),
        ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
      },
    });
    return this.toRecord(coupon);
  }

  private toRecord(coupon: Coupon): CouponRecord {
    return {
      id: coupon.id,
      businessId: coupon.businessId,
      code: coupon.code,
      type: coupon.type,
      value: coupon.value.toNumber(),
      minOrderAmountPaise: coupon.minOrderAmountPaise,
      maxDiscountPaise: coupon.maxDiscountPaise,
      usageLimit: coupon.usageLimit,
      perUserLimit: coupon.perUserLimit,
      startsAt: coupon.startsAt,
      expiresAt: coupon.expiresAt,
      isActive: coupon.isActive,
    };
  }
}
