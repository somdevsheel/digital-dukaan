import { Inject, Injectable, Logger } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import {
  PAYMENT_TRANSACTION_REPOSITORY,
  type PaymentTransactionRepository,
} from "../../domain/repositories/payment-transaction.repository";

/**
 * Called by the webhook controller after signature verification. Idempotent by design —
 * Razorpay retries webhook delivery on any non-2xx response, so a redelivered event for an
 * already-confirmed payment must be a no-op, not a double-credit (Architecture §6 webhook
 * design).
 */
@Injectable()
export class ConfirmPaymentUseCase {
  private readonly logger = new Logger(ConfirmPaymentUseCase.name);

  constructor(
    @Inject(PAYMENT_TRANSACTION_REPOSITORY) private readonly transactions: PaymentTransactionRepository,
    private readonly events: EventEmitter2,
  ) {}

  async execute(providerOrderId: string, succeeded: boolean): Promise<void> {
    const transaction = await this.transactions.findByProviderRefId(providerOrderId);
    if (!transaction) {
      // Genuinely unexpected (a webhook for an order this system never created a payment
      // intent for) — log loudly rather than silently 200-ing, but still ack the webhook
      // so Razorpay doesn't retry forever on something retrying can't fix.
      this.logger.error(`Webhook for unknown providerOrderId=${providerOrderId}`);
      return;
    }
    if (transaction.status !== "PENDING") {
      return; // already processed — redelivered webhook, not an error
    }

    await this.transactions.updateStatus(transaction.id, succeeded ? "SUCCESS" : "FAILED");

    if (transaction.orderId) {
      this.events.emit("payment.confirmed", { orderId: transaction.orderId, succeeded });
    }
  }
}
