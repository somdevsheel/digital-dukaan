import { ValidateCouponUseCase } from "./validate-coupon.use-case";
import type { CouponRecord, CouponRepository } from "../../domain/repositories/coupon.repository";
import { InvalidCouponException } from "../../domain/errors/commerce.errors";

function makeCoupon(overrides: Partial<CouponRecord> = {}): CouponRecord {
  return {
    id: "coupon-1",
    businessId: "biz-1",
    code: "WELCOME50",
    type: "PERCENT",
    value: 10,
    minOrderAmountPaise: null,
    maxDiscountPaise: null,
    usageLimit: null,
    perUserLimit: null,
    startsAt: new Date(Date.now() - 86_400_000),
    expiresAt: new Date(Date.now() + 86_400_000),
    isActive: true,
    ...overrides,
  };
}

function makeUseCase(coupon: CouponRecord | null, opts: { totalRedemptions?: number; userRedemptions?: number } = {}) {
  const repo: Pick<CouponRepository, "findByCode" | "countTotalRedemptions" | "countUserRedemptions"> = {
    findByCode: () => Promise.resolve(coupon),
    countTotalRedemptions: () => Promise.resolve(opts.totalRedemptions ?? 0),
    countUserRedemptions: () => Promise.resolve(opts.userRedemptions ?? 0),
  };
  return new ValidateCouponUseCase(repo as unknown as CouponRepository);
}

describe("ValidateCouponUseCase", () => {
  it("rejects a coupon code that doesn't exist", async () => {
    const useCase = makeUseCase(null);
    await expect(useCase.execute("NOPE", "biz-1", "user-1", 10_000)).rejects.toThrow(InvalidCouponException);
  });

  it("rejects a deactivated coupon", async () => {
    const useCase = makeUseCase(makeCoupon({ isActive: false }));
    await expect(useCase.execute("WELCOME50", "biz-1", "user-1", 10_000)).rejects.toThrow(InvalidCouponException);
  });

  it("rejects a coupon before its start date", async () => {
    const useCase = makeUseCase(makeCoupon({ startsAt: new Date(Date.now() + 86_400_000) }));
    await expect(useCase.execute("WELCOME50", "biz-1", "user-1", 10_000)).rejects.toThrow(InvalidCouponException);
  });

  it("rejects an expired coupon", async () => {
    const useCase = makeUseCase(makeCoupon({ expiresAt: new Date(Date.now() - 1000) }));
    await expect(useCase.execute("WELCOME50", "biz-1", "user-1", 10_000)).rejects.toThrow(InvalidCouponException);
  });

  it("rejects when the subtotal is below the coupon's minimum order amount", async () => {
    const useCase = makeUseCase(makeCoupon({ minOrderAmountPaise: 20_000 }));
    await expect(useCase.execute("WELCOME50", "biz-1", "user-1", 10_000)).rejects.toThrow(InvalidCouponException);
  });

  it("rejects once the global usage limit is reached", async () => {
    const useCase = makeUseCase(makeCoupon({ usageLimit: 100 }), { totalRedemptions: 100 });
    await expect(useCase.execute("WELCOME50", "biz-1", "user-1", 10_000)).rejects.toThrow(InvalidCouponException);
  });

  it("allows one redemption under the global usage limit", async () => {
    const useCase = makeUseCase(makeCoupon({ usageLimit: 100 }), { totalRedemptions: 99 });
    await expect(useCase.execute("WELCOME50", "biz-1", "user-1", 10_000)).resolves.toBeDefined();
  });

  it("rejects once this specific user has hit their per-user limit", async () => {
    const useCase = makeUseCase(makeCoupon({ perUserLimit: 1 }), { userRedemptions: 1 });
    await expect(useCase.execute("WELCOME50", "biz-1", "user-1", 10_000)).rejects.toThrow(InvalidCouponException);
  });

  it("computes a PERCENT discount correctly", async () => {
    const useCase = makeUseCase(makeCoupon({ type: "PERCENT", value: 10 }));
    const result = await useCase.execute("WELCOME50", "biz-1", "user-1", 10_000);
    expect(result.discountPaise).toBe(1_000); // 10% of 10,000
  });

  it("caps a PERCENT discount at maxDiscountPaise", async () => {
    const useCase = makeUseCase(makeCoupon({ type: "PERCENT", value: 50, maxDiscountPaise: 2_000 }));
    const result = await useCase.execute("WELCOME50", "biz-1", "user-1", 10_000);
    expect(result.discountPaise).toBe(2_000); // 50% would be 5,000, but capped at 2,000
  });

  it("computes a FLAT discount correctly", async () => {
    const useCase = makeUseCase(makeCoupon({ type: "FLAT", value: 500 }));
    const result = await useCase.execute("WELCOME50", "biz-1", "user-1", 10_000);
    expect(result.discountPaise).toBe(500);
  });

  it("never lets a FLAT discount exceed the subtotal (no negative total)", async () => {
    const useCase = makeUseCase(makeCoupon({ type: "FLAT", value: 50_000 }));
    const result = await useCase.execute("WELCOME50", "biz-1", "user-1", 10_000);
    expect(result.discountPaise).toBe(10_000);
  });
});
