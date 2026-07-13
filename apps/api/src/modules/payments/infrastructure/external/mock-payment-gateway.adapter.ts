import { randomUUID } from "node:crypto";
import { Injectable } from "@nestjs/common";
import type {
  GatewayOrder,
  PaymentGatewayPort,
  RefundResult,
  WebhookVerificationResult,
} from "../../domain/services/payment-gateway.port";

/**
 * Local-dev default (config's `razorpay.provider`, "mock" when `PAYMENT_PROVIDER` is
 * unset) — RazorpayGatewayAdapter makes a real HTTP call to Razorpay on every checkout,
 * which 500s with whatever placeholder key/secret a fresh clone's `.env` carries. This
 * mirrors ConsoleOtpSender's role for SMS: a working stand-in so the ONLINE checkout path
 * is exercisable without live third-party credentials, never wired into a production path.
 */
@Injectable()
export class MockPaymentGatewayAdapter implements PaymentGatewayPort {
  createOrder(amountPaise: number, receiptId: string): Promise<GatewayOrder> {
    return Promise.resolve({
      providerOrderId: `mock_order_${receiptId}_${randomUUID()}`,
      amountPaise,
      currency: "INR",
      keyId: "mock_key_id",
    });
  }

  verifyWebhookSignature(): WebhookVerificationResult {
    // No real gateway ever calls this webhook in mock mode, so there's nothing to verify —
    // return unconditionally invalid rather than pretending a signature check happened.
    return { valid: false, event: null, providerOrderId: null, providerPaymentId: null };
  }

  initiateRefund(providerPaymentId: string): Promise<RefundResult> {
    return Promise.resolve({ providerRefundId: `mock_refund_${providerPaymentId}_${randomUUID()}`, status: "PROCESSED" });
  }
}
