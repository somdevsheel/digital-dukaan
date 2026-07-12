import { createHmac, timingSafeEqual } from "node:crypto";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Razorpay from "razorpay";
import type {
  GatewayOrder,
  PaymentGatewayPort,
  RefundResult,
  WebhookVerificationResult,
} from "../../domain/services/payment-gateway.port";

@Injectable()
export class RazorpayGatewayAdapter implements PaymentGatewayPort {
  private readonly client: Razorpay;
  private readonly keyId: string;
  private readonly webhookSecret: string;

  constructor(config: ConfigService) {
    this.keyId = config.getOrThrow<string>("razorpay.keyId");
    this.webhookSecret = config.getOrThrow<string>("razorpay.webhookSecret");
    this.client = new Razorpay({ key_id: this.keyId, key_secret: config.getOrThrow<string>("razorpay.keySecret") });
  }

  async createOrder(amountPaise: number, receiptId: string): Promise<GatewayOrder> {
    const order = await this.client.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt: receiptId,
    });
    return { providerOrderId: order.id, amountPaise, currency: "INR", keyId: this.keyId };
  }

  verifyWebhookSignature(rawBody: Buffer, signatureHeader: string): WebhookVerificationResult {
    const expected = createHmac("sha256", this.webhookSecret).update(rawBody).digest("hex");
    const provided = Buffer.from(signatureHeader ?? "", "utf8");
    const expectedBuf = Buffer.from(expected, "utf8");

    // Constant-time comparison — a naive `===` leaks timing information about how many
    // leading bytes matched, in principle usable to forge a valid signature byte-by-byte.
    const valid =
      provided.length === expectedBuf.length && timingSafeEqual(provided, expectedBuf);

    if (!valid) {
      return { valid: false, event: null, providerOrderId: null, providerPaymentId: null };
    }

    const payload = JSON.parse(rawBody.toString("utf8")) as {
      event: string;
      payload: { order?: { entity?: { id: string } }; payment?: { entity?: { id: string; order_id?: string } } };
    };

    return {
      valid: true,
      event: payload.event,
      providerOrderId: payload.payload.order?.entity?.id ?? payload.payload.payment?.entity?.order_id ?? null,
      providerPaymentId: payload.payload.payment?.entity?.id ?? null,
    };
  }

  async initiateRefund(providerPaymentId: string, amountPaise: number): Promise<RefundResult> {
    const refund = await this.client.payments.refund(providerPaymentId, { amount: amountPaise });
    return { providerRefundId: refund.id, status: refund.status === "processed" ? "PROCESSED" : "PENDING" };
  }
}
