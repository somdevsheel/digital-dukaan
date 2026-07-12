export interface GatewayOrder {
  providerOrderId: string;
  amountPaise: number;
  currency: string;
  keyId: string; // public key the client-side Checkout SDK needs — never the secret
}

export interface WebhookVerificationResult {
  valid: boolean;
  event: string | null;
  providerOrderId: string | null;
  providerPaymentId: string | null;
}

export interface RefundResult {
  providerRefundId: string;
  status: "PENDING" | "PROCESSED";
}

/**
 * Port — Razorpay is the concrete provider (Architecture ADR-008); Stripe is a future
 * second implementation of this same interface, not a parallel code path (PRD monetization
 * §11/tech stack: "Stripe abstraction" for later international expansion).
 */
export interface PaymentGatewayPort {
  createOrder(amountPaise: number, receiptId: string): Promise<GatewayOrder>;
  verifyWebhookSignature(rawBody: Buffer, signatureHeader: string): WebhookVerificationResult;
  initiateRefund(providerPaymentId: string, amountPaise: number): Promise<RefundResult>;
}

export const PAYMENT_GATEWAY_PORT = Symbol("PAYMENT_GATEWAY_PORT");
