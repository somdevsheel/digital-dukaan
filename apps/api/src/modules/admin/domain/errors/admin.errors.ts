import { ForbiddenException, NotFoundException } from "../../../../common/errors/app.errors";

export class TicketNotFoundException extends NotFoundException {
  constructor() {
    super("Support ticket");
  }
}

export class DisputeNotFoundException extends NotFoundException {
  constructor() {
    super("Dispute");
  }
}

export class NotYourTicketException extends ForbiddenException {
  constructor() {
    super("This support ticket does not belong to you");
  }
}
