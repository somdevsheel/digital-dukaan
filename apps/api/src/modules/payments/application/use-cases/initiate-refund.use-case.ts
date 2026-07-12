import { Inject, Injectable } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import {
  PAYMENT_TRANSACTION_REPOSITORY,
  type PaymentTransactionRepository,
} from "../../domain/repositories/payment-transaction.repository";
import { PAYMENT_GATEWAY_PORT, type PaymentGatewayPort } from "../../domain/services/payment-gateway.port";
import { AppException } from "../../../../common/errors/app.errors";

@Injectable()
export class InitiateRefundUseCase {
  constructor(
    @Inject(PAYMENT_TRANSACTION_REPOSITORY) private readonly transactions: PaymentTransactionRepository,
    @Inject(PAYMENT_GATEWAY_PORT) private readonly gateway: PaymentGatewayPort,
    private readonly events: EventEmitter2,
  ) {}

  async execute(orderId: string, amountPaise: number): Promise<void> {
    const orderTransactions = await this.transactions.listForOrder(orderId);
    const successfulPayment = orderTransactions.find((t) => t.type === "PAYMENT" && t.status === "SUCCESS");

    if (!successfulPayment) {
      // COD orders, or an order that was never actually paid online, have nothing to
      // refund through the gateway — cancellation for those is handled entirely by
      // Commerce's order-status transition, no Payments involvement needed.
      return;
    }
    if (!successfulPayment.providerRefId) {
      throw new AppException("INTERNAL_ERROR", "Successful payment is missing its provider reference");
    }

    const refund = await this.gateway.initiateRefund(successfulPayment.providerRefId, amountPaise);
    await this.transactions.create({
      orderId,
      type: "REFUND",
      amountPaise,
      provider: successfulPayment.provider,
      providerRefId: refund.providerRefundId,
      status: refund.status === "PROCESSED" ? "SUCCESS" : "PENDING",
    });

    this.events.emit("payment.refund_initiated", { orderId, amountPaise });
  }
}
