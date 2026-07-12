import { ConflictException, ForbiddenException, NotFoundException, ValidationException } from "../../../../common/errors/app.errors";

export class DeliveryPartnerNotFoundException extends NotFoundException {
  constructor() {
    super("Delivery partner profile");
  }
}

export class DeliveryNotFoundException extends NotFoundException {
  constructor() {
    super("Delivery");
  }
}

export class DeliveryAlreadyAssignedException extends ConflictException {
  constructor() {
    super("This delivery was just accepted by another partner");
  }
}

export class InvalidDeliveryOtpException extends ValidationException {
  constructor() {
    super("Incorrect OTP");
  }
}

export class NotAssignedToThisDeliveryException extends ForbiddenException {
  constructor() {
    super("You are not assigned to this delivery");
  }
}
