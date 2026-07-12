import { AppException, ConflictException, ForbiddenException, NotFoundException } from "../../../../common/errors/app.errors";

export class CartNotFoundException extends NotFoundException {
  constructor() {
    super("Cart");
  }
}

export class OrderNotFoundException extends NotFoundException {
  constructor() {
    super("Order");
  }
}

export class InvalidCouponException extends AppException {
  constructor(message: string) {
    super("VALIDATION_ERROR", message);
  }
}

export class StockUnavailableException extends AppException {
  constructor(unavailableVariantIds: string[]) {
    super("STOCK_UNAVAILABLE", "Some items are no longer available in the requested quantity", { unavailableVariantIds });
  }
}

export class IllegalOrderTransitionException extends ConflictException {
  constructor(from: string, to: string) {
    super(`Cannot move an order from ${from} to ${to}`);
  }
}

export class OrderNotCancellableException extends ForbiddenException {
  constructor() {
    super("This order can no longer be cancelled");
  }
}
