import { HttpException, HttpStatus } from "@nestjs/common";

// Mirrors the error taxonomy in docs/04-api-design/API_DESIGN.md §2 exactly — every
// domain-layer failure throws one of these (never a bare Error), so the global filter
// can map it to the standard { error: { code, message, details } } envelope without
// guessing at intent.
export type ErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "IDEMPOTENCY_KEY_REUSED"
  | "RATE_LIMITED"
  | "PAYMENT_FAILED"
  | "STOCK_UNAVAILABLE"
  | "INTERNAL_ERROR";

const STATUS_BY_CODE: Record<ErrorCode, HttpStatus> = {
  VALIDATION_ERROR: HttpStatus.BAD_REQUEST,
  UNAUTHENTICATED: HttpStatus.UNAUTHORIZED,
  FORBIDDEN: HttpStatus.FORBIDDEN,
  NOT_FOUND: HttpStatus.NOT_FOUND,
  CONFLICT: HttpStatus.CONFLICT,
  IDEMPOTENCY_KEY_REUSED: HttpStatus.CONFLICT,
  RATE_LIMITED: HttpStatus.TOO_MANY_REQUESTS,
  PAYMENT_FAILED: HttpStatus.PAYMENT_REQUIRED,
  STOCK_UNAVAILABLE: HttpStatus.CONFLICT,
  INTERNAL_ERROR: HttpStatus.INTERNAL_SERVER_ERROR,
};

export class AppException extends HttpException {
  public readonly errorCode: ErrorCode;
  public readonly details?: Record<string, unknown> | undefined;

  constructor(code: ErrorCode, message: string, details?: Record<string, unknown>) {
    super({ code, message, details }, STATUS_BY_CODE[code]);
    this.errorCode = code;
    this.details = details;
  }
}

export class UnauthenticatedException extends AppException {
  constructor(message = "Authentication required") {
    super("UNAUTHENTICATED", message);
  }
}

export class ForbiddenException extends AppException {
  constructor(message = "You do not have permission to perform this action") {
    super("FORBIDDEN", message);
  }
}

export class NotFoundException extends AppException {
  constructor(entity: string) {
    super("NOT_FOUND", `${entity} not found`);
  }
}

export class ConflictException extends AppException {
  constructor(message: string, details?: Record<string, unknown>) {
    super("CONFLICT", message, details);
  }
}

export class ValidationException extends AppException {
  constructor(message: string, details?: Record<string, unknown>) {
    super("VALIDATION_ERROR", message, details);
  }
}
