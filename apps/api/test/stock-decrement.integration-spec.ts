import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { PrismaProductRepository } from "../src/modules/business/infrastructure/persistence/prisma-product.repository";

/**
 * Proves the single most important correctness guarantee in the whole system (Database
 * Design §6, Architecture §22): concurrent checkout attempts against the same limited-stock
 * variant must never oversell, and must never leave stock negative. A unit test with a
 * mocked repository cannot actually prove this — it can only assert that the *code* calls
 * the right Prisma method, not that Postgres's row-locking behaves the way the design
 * assumes under real concurrent connections. This test opens N real connections against
 * a real Postgres and fires them at the same row simultaneously.
 *
 * Requires the local dev infra running: `pnpm infra:up` from the repo root, and
 * DATABASE_URL pointing at it (apps/api/.env, or the default from .env.example).
 */

const prisma = new PrismaClient();
const repository = new PrismaProductRepository(prisma as never);

let businessTypeId: string;
let cityId: string;
let businessId: string;
let ownerId: string;
let productId: string;
let variantId: string;

const STARTING_STOCK = 10;

beforeAll(async () => {
  await prisma.$connect();

  const businessType = await prisma.businessType.create({
    data: { name: `TEST_TYPE_${randomUUID()}`, commerceModel: "PRODUCT", sortOrder: 999 },
  });
  businessTypeId = businessType.id;

  const city = await prisma.city.create({ data: { name: `TestCity_${randomUUID()}`, state: "TestState" } });
  cityId = city.id;

  const owner = await prisma.user.create({ data: { email: `owner-${randomUUID()}@test.local`, fullName: "Test Owner" } });
  ownerId = owner.id;

  const business = await prisma.business.create({
    data: {
      ownerUserId: owner.id,
      businessTypeId,
      cityId,
      name: "Test Stock Shop",
      slug: `test-stock-shop-${randomUUID()}`,
      addressLine: "1 Test Street",
      pinCode: "000000",
      latitude: 19.076,
      longitude: 72.8777,
    },
  });
  businessId = business.id;

  const product = await prisma.product.create({
    data: {
      businessId,
      name: "Test Product",
      slug: `test-product-${randomUUID()}`,
      basePricePaise: 10000,
      variants: { create: [{ name: "Default", pricePaise: 10000, stockQuantity: STARTING_STOCK }] },
    },
    include: { variants: true },
  });
  productId = product.id;
  variantId = product.variants[0]!.id;
});

afterAll(async () => {
  // Cleanup in FK-safe order — everything this test created cascades from businessId/productId.
  await prisma.productVariant.deleteMany({ where: { productId } });
  await prisma.product.deleteMany({ where: { id: productId } });
  await prisma.business.deleteMany({ where: { id: businessId } });
  await prisma.businessType.deleteMany({ where: { id: businessTypeId } });
  await prisma.city.deleteMany({ where: { id: cityId } });
  await prisma.user.deleteMany({ where: { id: ownerId } });
  await prisma.$disconnect();
});

describe("PrismaProductRepository.decrementStock — real concurrency, real Postgres", () => {
  it(`allows exactly ${STARTING_STOCK} of ${STARTING_STOCK * 2} simultaneous 1-unit decrements to succeed, never going negative`, async () => {
    const attempts = STARTING_STOCK * 2; // deliberately 2x the available stock

    const results = await Promise.all(
      Array.from({ length: attempts }, () => repository.decrementStock(variantId, 1)),
    );

    const succeeded = results.filter(Boolean).length;
    const failed = results.filter((r) => !r).length;

    expect(succeeded).toBe(STARTING_STOCK);
    expect(failed).toBe(attempts - STARTING_STOCK);

    const finalVariant = await prisma.productVariant.findUniqueOrThrow({ where: { id: variantId } });
    expect(finalVariant.stockQuantity).toBe(0); // not negative, not stuck above 0
  });

  it("rejects a decrement larger than remaining stock without partially applying it", async () => {
    // Stock is 0 after the previous test — a request for even 1 more unit must fail
    // cleanly, not decrement into negative territory.
    const succeeded = await repository.decrementStock(variantId, 1);
    expect(succeeded).toBe(false);

    const variant = await prisma.productVariant.findUniqueOrThrow({ where: { id: variantId } });
    expect(variant.stockQuantity).toBe(0);
  });
});
