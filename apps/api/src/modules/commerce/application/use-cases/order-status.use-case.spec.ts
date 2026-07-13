import { EventEmitter2 } from "@nestjs/event-emitter";
import { OrderStatusUseCase } from "./order-status.use-case";
import type { OrderRecord, OrderRepository, OrderStatus } from "../../domain/repositories/order.repository";
import type { InitiateRefundUseCase } from "../../../payments/application/use-cases/initiate-refund.use-case";
import { ForbiddenException } from "../../../../common/errors/app.errors";
import { IllegalOrderTransitionException, OrderNotCancellableException, OrderNotFoundException } from "../../domain/errors/commerce.errors";

function makeOrder(overrides: Partial<OrderRecord> = {}): OrderRecord {
  return {
    id: "order-1",
    orderNumber: "ORD-2026-00001",
    userId: "customer-1",
    businessId: "biz-1",
    cityId: "city-1",
    addressId: null,
    fulfillmentType: "DELIVERY",
    status: "PLACED",
    subtotalPaise: 10_000,
    taxPaise: 0,
    deliveryFeePaise: 2500,
    platformFeePaise: 500,
    discountPaise: 0,
    totalPaise: 13_000,
    paymentMethod: "COD",
    paymentStatus: "PENDING",
    couponId: null,
    cancelReason: null,
    placedAt: new Date(),
    items: [],
    ...overrides,
  };
}

// A small in-memory fake rather than a mock library — the state-machine tests below care
// about *sequences* of calls (find, then transition, then restoreStock), which a fake
// models more readably than a pile of jest.fn() assertions.
class FakeOrderRepository implements Pick<OrderRepository, "findById" | "transitionStatus" | "restoreStock"> {
  public restoreStockCalls: string[] = [];
  public transitionCalls: Array<{ id: string; toStatus: OrderStatus; changedBy: string | null }> = [];

  constructor(private order: OrderRecord | null) {}

  findById = (): Promise<OrderRecord | null> => Promise.resolve(this.order);

  transitionStatus = (id: string, toStatus: OrderStatus, changedBy: string | null): Promise<OrderRecord> => {
    this.transitionCalls.push({ id, toStatus, changedBy });
    this.order = { ...this.order!, status: toStatus };
    return Promise.resolve(this.order);
  };

  restoreStock = (orderId: string): Promise<void> => {
    this.restoreStockCalls.push(orderId);
    return Promise.resolve();
  };
}

function makeUseCase(order: OrderRecord | null) {
  const repo = new FakeOrderRepository(order);
  const refundExecute = jest.fn().mockResolvedValue(undefined);
  const refund = { execute: refundExecute } as unknown as InitiateRefundUseCase;
  const events = new EventEmitter2();
  const emitSpy = jest.spyOn(events, "emit");
  const useCase = new OrderStatusUseCase(repo as unknown as OrderRepository, refund, events);
  return { useCase, repo, refundExecute, emitSpy };
}

describe("OrderStatusUseCase — merchantTransition", () => {
  it("allows PLACED -> ACCEPTED", async () => {
    const { useCase, repo } = makeUseCase(makeOrder({ status: "PLACED" }));
    await useCase.merchantTransition("biz-1", "order-1", "ACCEPTED", "owner-1");
    expect(repo.transitionCalls).toEqual([{ id: "order-1", toStatus: "ACCEPTED", changedBy: "owner-1" }]);
  });

  it("rejects an illegal transition, e.g. PLACED -> DELIVERED (skipping the whole fulfillment sequence)", async () => {
    const { useCase } = makeUseCase(makeOrder({ status: "PLACED" }));
    await expect(useCase.merchantTransition("biz-1", "order-1", "DELIVERED", "owner-1")).rejects.toThrow(IllegalOrderTransitionException);
  });

  it("rejects re-transitioning out of a terminal state, e.g. CANCELLED -> ACCEPTED", async () => {
    const { useCase } = makeUseCase(makeOrder({ status: "CANCELLED" }));
    await expect(useCase.merchantTransition("biz-1", "order-1", "ACCEPTED", "owner-1")).rejects.toThrow(IllegalOrderTransitionException);
  });

  it("rejects a merchant acting on another business's order", async () => {
    const { useCase } = makeUseCase(makeOrder({ status: "PLACED", businessId: "biz-1" }));
    await expect(useCase.merchantTransition("biz-OTHER", "order-1", "ACCEPTED", "owner-1")).rejects.toThrow(ForbiddenException);
  });

  it("restores stock and initiates a refund when a merchant cancels", async () => {
    const { useCase, repo, refundExecute } = makeUseCase(makeOrder({ status: "ACCEPTED", totalPaise: 13_000 }));
    await useCase.merchantTransition("biz-1", "order-1", "CANCELLED", "owner-1", "Out of stock");

    expect(repo.restoreStockCalls).toEqual(["order-1"]);
    expect(refundExecute).toHaveBeenCalledWith("order-1", 13_000);
  });

  it("does not restore stock or refund for a non-cancelling transition", async () => {
    const { useCase, repo, refundExecute } = makeUseCase(makeOrder({ status: "ACCEPTED" }));
    await useCase.merchantTransition("biz-1", "order-1", "PACKING", "owner-1");

    expect(repo.restoreStockCalls).toEqual([]);
    expect(refundExecute).not.toHaveBeenCalled();
  });

  it("allows READY -> COMPLETED directly for pickup orders (no delivery partner in the loop)", async () => {
    const { useCase, repo } = makeUseCase(makeOrder({ status: "READY", fulfillmentType: "PICKUP" }));
    await useCase.merchantTransition("biz-1", "order-1", "COMPLETED", "owner-1");
    expect(repo.transitionCalls[0]?.toStatus).toBe("COMPLETED");
  });

  it("throws OrderNotFoundException for a nonexistent order", async () => {
    const { useCase } = makeUseCase(null);
    await expect(useCase.merchantTransition("biz-1", "missing", "ACCEPTED", "owner-1")).rejects.toThrow(OrderNotFoundException);
  });

  it("emits order.status_changed with the order's own userId/businessId, not the actor's", async () => {
    const { useCase, emitSpy } = makeUseCase(makeOrder({ status: "PLACED", userId: "customer-42", businessId: "biz-1" }));
    await useCase.merchantTransition("biz-1", "order-1", "ACCEPTED", "owner-1");

    expect(emitSpy).toHaveBeenCalledWith(
      "order.status_changed",
      expect.objectContaining({ orderId: "order-1", userId: "customer-42", businessId: "biz-1", status: "ACCEPTED" }),
    );
  });
});

describe("OrderStatusUseCase — cancelByCustomer", () => {
  it("allows the owning customer to cancel a PLACED order", async () => {
    const { useCase, repo } = makeUseCase(makeOrder({ status: "PLACED", userId: "customer-1" }));
    await useCase.cancelByCustomer("customer-1", "order-1", "Changed my mind");
    expect(repo.transitionCalls[0]?.toStatus).toBe("CANCELLED");
  });

  it("rejects cancellation by a user who doesn't own the order", async () => {
    const { useCase } = makeUseCase(makeOrder({ status: "PLACED", userId: "customer-1" }));
    await expect(useCase.cancelByCustomer("someone-else", "order-1", "reason")).rejects.toThrow(ForbiddenException);
  });

  it("rejects cancelling an order that's already OUT_FOR_DELIVERY", async () => {
    // The whole reason CANCELLABLE_STATUSES exists as its own narrower list: a customer
    // cancelling after the rider already has the food in hand is a support-ticket
    // situation, not a self-service cancel button.
    const { useCase } = makeUseCase(makeOrder({ status: "OUT_FOR_DELIVERY", userId: "customer-1" }));
    await expect(useCase.cancelByCustomer("customer-1", "order-1", "reason")).rejects.toThrow(OrderNotCancellableException);
  });

  it("restores stock and refunds on customer cancellation, same as merchant cancellation", async () => {
    const { useCase, repo, refundExecute } = makeUseCase(makeOrder({ status: "PLACED", userId: "customer-1", totalPaise: 5_000 }));
    await useCase.cancelByCustomer("customer-1", "order-1", "reason");

    expect(repo.restoreStockCalls).toEqual(["order-1"]);
    expect(refundExecute).toHaveBeenCalledWith("order-1", 5_000);
  });
});

describe("OrderStatusUseCase — delivery-partner transitions", () => {
  it("markOutForDeliveryByPartner allows READY -> OUT_FOR_DELIVERY", async () => {
    const { useCase, repo } = makeUseCase(makeOrder({ status: "READY" }));
    await useCase.markOutForDeliveryByPartner("order-1", "partner-user-1");
    expect(repo.transitionCalls).toEqual([{ id: "order-1", toStatus: "OUT_FOR_DELIVERY", changedBy: "partner-user-1" }]);
  });

  it("markDeliveredByPartner allows OUT_FOR_DELIVERY -> DELIVERED", async () => {
    const { useCase, repo } = makeUseCase(makeOrder({ status: "OUT_FOR_DELIVERY" }));
    await useCase.markDeliveredByPartner("order-1", "partner-user-1");
    expect(repo.transitionCalls).toEqual([{ id: "order-1", toStatus: "DELIVERED", changedBy: "partner-user-1" }]);
  });

  it("markDeliveredByPartner rejects skipping straight from PLACED", async () => {
    const { useCase } = makeUseCase(makeOrder({ status: "PLACED" }));
    await expect(useCase.markDeliveredByPartner("order-1", "partner-user-1")).rejects.toThrow(IllegalOrderTransitionException);
  });
});
