import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import type { Request } from "express";
import { createHash } from "node:crypto";
import { of } from "rxjs";
import { tap } from "rxjs/operators";
import type Redis from "ioredis";
import { REDIS_CLIENT } from "../redis/redis.module";
import { AppException, ValidationException } from "../errors/app.errors";

const TTL_SECONDS = 24 * 60 * 60;

// Applied per-route (@UseInterceptors(IdempotencyInterceptor)) on the money/state-mutating
// endpoints listed in API Design §1 — checkout, order cancel, payment actions, order-status
// transitions. Not global: most endpoints don't need this, and forcing every client call
// to mint an idempotency key for reads would be pointless overhead.
@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest<Request>();
    const key = request.headers["idempotency-key"];

    if (!key || Array.isArray(key)) {
      throw new ValidationException("An Idempotency-Key header is required for this request.");
    }

    const bodyHash = createHash("sha256").update(JSON.stringify(request.body ?? {})).digest("hex");
    const redisKey = `idempotency:${key}`;
    const existing = await this.redis.get(redisKey);

    if (existing) {
      const cached = JSON.parse(existing) as { bodyHash: string; status: "pending" | "done"; response?: unknown };

      if (cached.bodyHash !== bodyHash) {
        throw new AppException(
          "IDEMPOTENCY_KEY_REUSED",
          "This Idempotency-Key was already used with a different request body.",
        );
      }
      if (cached.status === "done") {
        return of(cached.response);
      }
      // A request with this key is still in flight (racing retry) — reject rather than
      // double-executing a payment/order-mutation while the first attempt is unresolved.
      throw new AppException(
        "IDEMPOTENCY_KEY_REUSED",
        "A request with this Idempotency-Key is already being processed.",
      );
    }

    await this.redis.set(
      redisKey,
      JSON.stringify({ bodyHash, status: "pending" }),
      "EX",
      TTL_SECONDS,
    );

    return next.handle().pipe(
      tap({
        next: async (response) => {
          await this.redis.set(
            redisKey,
            JSON.stringify({ bodyHash, status: "done", response }),
            "EX",
            TTL_SECONDS,
          );
        },
        error: async () => {
          // Let a failed attempt be retried with the same key rather than permanently
          // wedging it in "pending".
          await this.redis.del(redisKey);
        },
      }),
    );
  }
}
