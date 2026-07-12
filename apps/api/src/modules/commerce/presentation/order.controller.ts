import { Body, Controller, Get, Param, Post, Query, UseInterceptors } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { IdempotencyInterceptor } from "../../../common/interceptors/idempotency.interceptor";
import type { AuthenticatedUser } from "../../../common/types/authenticated-user";
import { CheckoutDto } from "../application/dto/checkout.dto";
import { CancelOrderDto } from "../application/dto/order-status.dto";
import { CheckoutUseCase } from "../application/use-cases/checkout.use-case";
import { OrderQueryUseCase } from "../application/use-cases/order-query.use-case";
import { OrderStatusUseCase } from "../application/use-cases/order-status.use-case";

@ApiTags("orders")
@Controller()
export class OrderController {
  constructor(
    private readonly checkout: CheckoutUseCase,
    private readonly orderQuery: OrderQueryUseCase,
    private readonly orderStatus: OrderStatusUseCase,
  ) {}

  // Idempotency-Key required (API Design §1) — a retried checkout on a flaky mobile
  // connection must never place two orders.
  @UseInterceptors(IdempotencyInterceptor)
  @Post("orders")
  placeOrder(@CurrentUser() user: AuthenticatedUser, @Body() dto: CheckoutDto) {
    return this.checkout.execute(user.userId, dto);
  }

  @Get("me/orders")
  listMine(@CurrentUser() user: AuthenticatedUser, @Query("cursor") cursor?: string) {
    return this.orderQuery.listMine(user.userId, cursor);
  }

  @Get("orders/:id")
  getById(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.orderQuery.getByIdForCustomer(user.userId, id);
  }

  @Get("orders/:id/track")
  track(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.orderQuery.getTrackingInfo(user.userId, id);
  }

  @UseInterceptors(IdempotencyInterceptor)
  @Post("orders/:id/cancel")
  cancel(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() dto: CancelOrderDto) {
    return this.orderStatus.cancelByCustomer(user.userId, id, dto.reason);
  }
}
