import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { map, Observable } from "rxjs";

interface Envelope<T> {
  data: T;
  meta?: Record<string, unknown>;
}

// Wraps every successful controller return value in the { data, meta } envelope from
// API Design §1, so individual controllers never hand-roll it. A controller may return
// { data, meta } directly (e.g. paginated list endpoints setting nextCursor) — detected
// and passed through rather than double-wrapped.
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, Envelope<T>> {
  intercept(_context: ExecutionContext, next: CallHandler<T>): Observable<Envelope<T>> {
    return next.handle().pipe(
      map((payload) => {
        if (payload && typeof payload === "object" && "data" in (payload as object)) {
          return payload as unknown as Envelope<T>;
        }
        return { data: payload };
      }),
    );
  }
}
