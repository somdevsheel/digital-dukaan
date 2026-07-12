import { ConflictException, NotFoundException } from "../../../../common/errors/app.errors";

export class ServiceRequestNotFoundException extends NotFoundException {
  constructor() {
    super("Service request");
  }
}

export class ServiceRequestAlreadyRespondedException extends ConflictException {
  constructor() {
    super("This request has already been responded to");
  }
}
