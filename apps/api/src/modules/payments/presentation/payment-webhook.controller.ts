import { Controller, Headers, HttpCode, HttpStatus, Inject, Post, Req, type RawBodyRequest } from "@nestjs/common";
import { ApiExcludeController } from "@nestjs/swagger";
import type { Request } from "express";
import { Public } from "../../../common/decorators/public.decorator";
import { PAYMENT_GATEWAY_PORT, type PaymentGatewayPort } from "../domain/services/payment-gateway.port";
import { InvalidWebhookSignatureException } from "../domain/errors/payment.errors";
import { ConfirmPaymentUseCase } from "../application/use-cases/confirm-payment.use-case";

// Excluded from the public Swagger doc — this isn't an endpoint any client app calls.
@ApiExcludeController()
@Controller("payments/razorpay")
export class PaymentWebhookController {
  constructor(
    @Inject(PAYMENT_GATEWAY_PORT) private readonly gateway: PaymentGatewayPort,
    private readonly confirmPayment: ConfirmPaymentUseCase,
  ) {}

  // No JwtAuthGuard scope makes sense here — Razorpay isn't a logged-in user. Trust is
  // established entirely by the HMAC signature (API Design §6), not a bearer token.
  @Public()
  @Post("webhook")
  @HttpCode(HttpStatus.OK)
  async handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers("x-razorpay-signature") signature: string,
  ): Promise<{ received: true }> {
    if (!req.rawBody) {
      throw new InvalidWebhookSignatureException();
    }

    const result = this.gateway.verifyWebhookSignature(req.rawBody, signature);
    if (!result.valid) {
      throw new InvalidWebhookSignatureException();
    }

    // Fast-ack pattern (Architecture §6): validate and hand off, don't do the DB/event
    // work on the webhook's own request-response cycle where a slow step could cause
    // Razorpay to time out and retry unnecessarily. `execute` here is fast enough (a
    // couple of indexed writes) that a real queue hand-off isn't warranted yet — revisit
    // if payment volume ever makes this endpoint's latency a concern.
    if (result.providerOrderId && (result.event === "payment.captured" || result.event === "payment.failed")) {
      await this.confirmPayment.execute(result.providerOrderId, result.event === "payment.captured");
    }

    return { received: true };
  }
}
