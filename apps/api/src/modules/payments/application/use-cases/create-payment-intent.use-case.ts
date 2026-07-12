import { Inject, Injectable } from "@nestjs/common";
import {
  PAYMENT_TRANSACTION_REPOSITORY,
  type PaymentTransactionRepository,
} from "../../domain/repositories/payment-transaction.repository";
import { PAYMENT_GATEWAY_PORT, type PaymentGatewayPort } from "../../domain/services/payment-gateway.port";

export interface PaymentIntentResult {
  paymentMethod: "ONLINE" | "COD";
  gateway?: { provider: "RAZORPAY"; providerOrderId: string; amountPaise: number; keyId: string };
}

/**
 * Called by Commerce's checkout use case — deliberately BEFORE the DB transaction that
 * creates the Order/OrderItems/stock-decrement, not inside it: `gateway.createOrder` is an
 * external HTTP call to Razorpay, and holding a DB transaction open across a network call
 * risks connection-pool exhaustion and long lock times for no benefit. An orphaned
 * Razorpay order (created here, then the local transaction fails for an unrelated reason)
 * is harmless — it's an unused payment intent that simply expires, never a charge.
 * COD skips the external call entirely — the ledger row exists purely as the record that
 * this order's payment is "pending collection," matched against CashCollection later by
 * the Delivery module.
 */
@Injectable()
export class CreatePaymentIntentUseCase {
  constructor(
    @Inject(PAYMENT_TRANSACTION_REPOSITORY) private readonly transactions: PaymentTransactionRepository,
    @Inject(PAYMENT_GATEWAY_PORT) private readonly gateway: PaymentGatewayPort,
  ) {}

  async execute(orderId: string, orderNumber: string, amountPaise: number, paymentMethod: "ONLINE" | "COD"): Promise<PaymentIntentResult> {
    if (paymentMethod === "COD") {
      await this.transactions.create({
        orderId,
        type: "PAYMENT",
        amountPaise,
        provider: "COD",
        status: "PENDING",
      });
      return { paymentMethod: "COD" };
    }

    const gatewayOrder = await this.gateway.createOrder(amountPaise, orderNumber);
    await this.transactions.create({
      orderId,
      type: "PAYMENT",
      amountPaise,
      provider: "RAZORPAY",
      providerRefId: gatewayOrder.providerOrderId,
      status: "PENDING",
    });

    return {
      paymentMethod: "ONLINE",
      gateway: {
        provider: "RAZORPAY",
        providerOrderId: gatewayOrder.providerOrderId,
        amountPaise: gatewayOrder.amountPaise,
        keyId: gatewayOrder.keyId,
      },
    };
  }
}
