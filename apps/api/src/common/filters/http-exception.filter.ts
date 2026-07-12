import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { AppException, type ErrorCode } from "../errors/app.errors";

interface ErrorEnvelope {
  error: {
    code: ErrorCode | "INTERNAL_ERROR";
    message: string;
    details?: Record<string, unknown>;
  };
}

// Single place every thrown exception funnels through — guarantees the API Design §2
// envelope shape regardless of whether the throw site used AppException, a NestJS
// built-in HttpException (e.g. from a ValidationPipe failure), or an unhandled bug.
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger("ExceptionFilter");

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const correlationId = request.headers["x-correlation-id"] ?? "unknown";

    if (exception instanceof AppException) {
      response.status(exception.getStatus()).json({
        error: {
          code: exception.errorCode,
          message: exception.message,
          ...(exception.details ? { details: exception.details } : {}),
        },
      } satisfies ErrorEnvelope);
      return;
    }

    // Recurs constantly across every repository: a compound `where` (e.g. { id, cartId })
    // used to atomically scope an update/delete to a specific parent throws P2025 when
    // nothing matches — including the legitimate "exists but belongs to someone else" case.
    // Translated centrally here rather than in every individual call site.
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === "P2025") {
        response.status(HttpStatus.NOT_FOUND).json({
          error: { code: "NOT_FOUND", message: "The requested resource was not found" },
        } satisfies ErrorEnvelope);
        return;
      }
      if (exception.code === "P2002") {
        response.status(HttpStatus.CONFLICT).json({
          error: { code: "CONFLICT", message: "This record already exists" },
        } satisfies ErrorEnvelope);
        return;
      }
    }

    if (exception instanceof HttpException) {
      // Covers ValidationPipe failures and any other framework-thrown HttpException —
      // normalized to VALIDATION_ERROR for 400s, otherwise a generic mapped code.
      const status = exception.getStatus();
      const body = exception.getResponse();
      const message =
        typeof body === "string"
          ? body
          : Array.isArray((body as { message?: unknown }).message)
            ? ((body as { message: string[] }).message.join("; "))
            : ((body as { message?: string }).message ?? exception.message);

      response.status(status).json({
        error: {
          code: status === HttpStatus.BAD_REQUEST ? "VALIDATION_ERROR" : "INTERNAL_ERROR",
          message,
        },
      } satisfies ErrorEnvelope);
      return;
    }

    // Unhandled — log with correlation ID for tracing, never leak internals to the client.
    this.logger.error(
      `Unhandled exception [correlationId=${correlationId}]`,
      exception instanceof Error ? exception.stack : String(exception),
    );
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      error: { code: "INTERNAL_ERROR", message: "Something went wrong. Please try again." },
    } satisfies ErrorEnvelope);
  }
}
