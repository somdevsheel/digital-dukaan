export interface CouponRecord {
  id: string;
  businessId: string | null;
  code: string;
  type: "PERCENT" | "FLAT";
  value: number;
  minOrderAmountPaise: number | null;
  maxDiscountPaise: number | null;
  usageLimit: number | null;
  perUserLimit: number | null;
  startsAt: Date;
  expiresAt: Date;
  isActive: boolean;
}

export interface CreateCouponInput {
  code: string;
  type: "PERCENT" | "FLAT";
  value: number;
  minOrderAmountPaise?: number | undefined;
  maxDiscountPaise?: number | undefined;
  usageLimit?: number | undefined;
  perUserLimit?: number | undefined;
  startsAt: Date;
  expiresAt: Date;
}

export type UpdateCouponInput = Partial<CreateCouponInput> & { isActive?: boolean | undefined };

export interface CouponRepository {
  findByCode(code: string, businessId: string): Promise<CouponRecord | null>;
  /** COUNT(*) queries, not a mutable counter (Database Design §4.7) — correctness under concurrent redemption. */
  countTotalRedemptions(couponId: string): Promise<number>;
  countUserRedemptions(couponId: string, userId: string): Promise<number>;

  findById(id: string): Promise<CouponRecord | null>;
  listForBusiness(businessId: string): Promise<CouponRecord[]>;
  create(businessId: string, input: CreateCouponInput): Promise<CouponRecord>;
  update(id: string, input: UpdateCouponInput): Promise<CouponRecord>;
}

export const COUPON_REPOSITORY = Symbol("COUPON_REPOSITORY");
