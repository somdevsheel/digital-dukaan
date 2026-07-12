import {
  AppException,
  ConflictException,
  UnauthenticatedException,
  ValidationException,
} from "../../../../common/errors/app.errors";

export class InvalidCredentialsException extends UnauthenticatedException {
  constructor() {
    super("Invalid email or password");
  }
}

export class InvalidOtpException extends ValidationException {
  constructor(attemptsRemaining: number) {
    super("Invalid or expired OTP", { attemptsRemaining });
  }
}

export class OtpRateLimitedException extends AppException {
  constructor() {
    super("RATE_LIMITED", "Too many OTP requests for this number — try again later");
  }
}

export class EmailAlreadyRegisteredException extends ConflictException {
  constructor() {
    super("An account with this email already exists");
  }
}

export class RefreshTokenReuseDetectedException extends UnauthenticatedException {
  constructor() {
    super("This session has been invalidated — please sign in again");
  }
}
