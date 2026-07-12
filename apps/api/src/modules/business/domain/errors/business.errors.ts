import { ConflictException, ForbiddenException, NotFoundException } from "../../../../common/errors/app.errors";

export class BusinessNotFoundException extends NotFoundException {
  constructor() {
    super("Business");
  }
}

export class SlugAlreadyTakenException extends ConflictException {
  constructor() {
    super("A business with this URL slug already exists — choose a different name or slug");
  }
}

export class BusinessNotVerifiedException extends ForbiddenException {
  constructor() {
    super("This business is not yet verified and cannot go live");
  }
}

export class InsufficientStockException extends ConflictException {
  constructor(variantId: string) {
    super("One or more items are no longer available in the requested quantity", { variantId });
  }
}
