import { AppException, ConflictException, UnauthenticatedException } from "../../../../common/errors/app.errors";

export class InvalidWebhookSignatureException extends UnauthenticatedException {
  constructor() {
    super("Invalid webhook signature");
  }
}

export class PaymentAlreadyProcessedException extends ConflictException {
  constructor() {
    super("This payment has already been processed");
  }
}

export class PaymentFailedException extends AppException {
  constructor(message = "Payment could not be completed") {
    super("PAYMENT_FAILED", message);
  }
}
