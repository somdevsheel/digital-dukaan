import { ConflictException, ForbiddenException } from "../../../../common/errors/app.errors";

export class ReviewNotAllowedException extends ForbiddenException {
  constructor() {
    super("You can only review an order after it has been delivered or completed");
  }
}

export class ReviewAlreadyExistsException extends ConflictException {
  constructor() {
    super("You've already reviewed this order");
  }
}
