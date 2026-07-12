import { Module } from "@nestjs/common";
import { PAYMENT_TRANSACTION_REPOSITORY } from "./domain/repositories/payment-transaction.repository";
import { PAYMENT_GATEWAY_PORT } from "./domain/services/payment-gateway.port";
import { PrismaPaymentTransactionRepository } from "./infrastructure/persistence/prisma-payment-transaction.repository";
import { RazorpayGatewayAdapter } from "./infrastructure/external/razorpay-gateway.adapter";
import { CreatePaymentIntentUseCase } from "./application/use-cases/create-payment-intent.use-case";
import { ConfirmPaymentUseCase } from "./application/use-cases/confirm-payment.use-case";
import { InitiateRefundUseCase } from "./application/use-cases/initiate-refund.use-case";
import { PaymentWebhookController } from "./presentation/payment-webhook.controller";

@Module({
  controllers: [PaymentWebhookController],
  providers: [
    { provide: PAYMENT_TRANSACTION_REPOSITORY, useClass: PrismaPaymentTransactionRepository },
    // Swap to a StripeGatewayAdapter for international expansion (Architecture ADR-008) —
    // Commerce's checkout use case only ever depends on PAYMENT_GATEWAY_PORT, never Razorpay directly.
    { provide: PAYMENT_GATEWAY_PORT, useClass: RazorpayGatewayAdapter },

    CreatePaymentIntentUseCase,
    ConfirmPaymentUseCase,
    InitiateRefundUseCase,
  ],
  // Exported for Commerce module's checkout (create intent) and cancel (refund) use cases.
  exports: [PAYMENT_TRANSACTION_REPOSITORY, CreatePaymentIntentUseCase, InitiateRefundUseCase],
})
export class PaymentsModule {}
