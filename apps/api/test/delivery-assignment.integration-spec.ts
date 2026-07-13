import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { PrismaDeliveryRepository } from "../src/modules/delivery/infrastructure/persistence/prisma-delivery.repository";

/**
 * The other half of the "conditional atomic UPDATE instead of a Redis lock" decision
 * (Delivery module's DeliveryRepository doc comment, and Architecture ADR discussion) —
 * proves that when N delivery partners tap "Accept" on the same offer simultaneously,
 * Postgres's row-level locking during a single conditional UPDATE guarantees exactly one
 * wins, with no dependency on Redis at all for this specific guarantee.
 *
 * Requires the local dev infra running: `pnpm infra:up` from the repo root.
 */

const prisma = new PrismaClient();
const repository = new PrismaDeliveryRepository(prisma as never);

const PARTNER_COUNT = 15;

let businessTypeId: string;
let cityId: string;
let businessId: string;
let customerId: string;
let orderId: string;
let deliveryId: string;
let partnerIds: string[] = [];

beforeAll(async () => {
  await prisma.$connect();

  const businessType = await prisma.businessType.create({
    data: { name: `TEST_TYPE_${randomUUID()}`, commerceModel: "PRODUCT", sortOrder: 999 },
  });
  businessTypeId = businessType.id;

  const city = await prisma.city.create({ data: { name: `TestCity_${randomUUID()}`, state: "TestState" } });
  cityId = city.id;

  const owner = await prisma.user.create({ data: { email: `owner-${randomUUID()}@test.local`, fullName: "Test Owner" } });
  const business = await prisma.business.create({
    data: {
      ownerUserId: owner.id,
      businessTypeId,
      cityId,
      name: "Test Delivery Shop",
      slug: `test-delivery-shop-${randomUUID()}`,
      addressLine: "1 Test Street",
      pinCode: "000000",
      latitude: 19.076,
      longitude: 72.8777,
    },
  });
  businessId = business.id;

  const customer = await prisma.user.create({ data: { email: `customer-${randomUUID()}@test.local`, fullName: "Test Customer" } });
  customerId = customer.id;

  const order = await prisma.order.create({
    data: {
      orderNumber: `TEST-${randomUUID()}`,
      userId: customerId,
      businessId,
      cityId,
      fulfillmentType: "DELIVERY",
      status: "READY",
      subtotalPaise: 10000,
      totalPaise: 12500,
      paymentMethod: "COD",
    },
  });
  orderId = order.id;

  const delivery = await prisma.delivery.create({ data: { orderId, status: "UNASSIGNED" } });
  deliveryId = delivery.id;

  // N distinct delivery partners "racing" for the same delivery — a real accept race is
  // between different people, not the same partner retrying.
  const partnerUsers = await Promise.all(
    Array.from({ length: PARTNER_COUNT }, (_, i) =>
      prisma.user.create({ data: { email: `partner-${i}-${randomUUID()}@test.local`, fullName: `Test Partner ${i}` } }),
    ),
  );
  const partners = await Promise.all(
    partnerUsers.map((u) => prisma.deliveryPartner.create({ data: { userId: u.id, cityId, vehicleType: "BIKE" } })),
  );
  partnerIds = partners.map((p) => p.id);
});

afterAll(async () => {
  await prisma.delivery.deleteMany({ where: { id: deliveryId } });
  await prisma.order.deleteMany({ where: { id: orderId } });
  await prisma.deliveryPartner.deleteMany({ where: { id: { in: partnerIds } } });
  await prisma.business.deleteMany({ where: { id: businessId } });
  await prisma.businessType.deleteMany({ where: { id: businessTypeId } });
  await prisma.city.deleteMany({ where: { id: cityId } });
  // Users: owner, customer, and every partner's user row — cheaper to just sweep by email domain used above.
  await prisma.user.deleteMany({ where: { email: { endsWith: "@test.local" } } });
  await prisma.$disconnect();
});

describe("PrismaDeliveryRepository.assign — real concurrency, real Postgres", () => {
  it(`lets exactly 1 of ${PARTNER_COUNT} simultaneously-accepting partners win`, async () => {
    const results = await Promise.all(partnerIds.map((partnerId) => repository.assign(deliveryId, partnerId)));

    const winners = results.filter(Boolean).length;
    expect(winners).toBe(1);

    const delivery = await prisma.delivery.findUniqueOrThrow({ where: { id: deliveryId } });
    expect(delivery.status).toBe("ASSIGNED");
    expect(delivery.deliveryPartnerId).not.toBeNull();
    // The winning partner recorded on the row must be one of the partners who actually
    // got `true` back — not a different one, and not silently overwritten by a later loser.
    const winnerIndex = results.findIndex(Boolean);
    expect(delivery.deliveryPartnerId).toBe(partnerIds[winnerIndex]);
  });

  it("rejects a second accept attempt on an already-assigned delivery", async () => {
    const lateComer = partnerIds[partnerIds.length - 1]!;
    const succeeded = await repository.assign(deliveryId, lateComer);
    expect(succeeded).toBe(false);
  });
});
