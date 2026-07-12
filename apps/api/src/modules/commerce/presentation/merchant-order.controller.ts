import { Body, Controller, Get, Param, Patch, Query, UseInterceptors } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { RequirePermission } from "../../../common/decorators/require-permission.decorator";
import { IdempotencyInterceptor } from "../../../common/interceptors/idempotency.interceptor";
import type { AuthenticatedUser } from "../../../common/types/authenticated-user";
import type { OrderStatus } from "../domain/repositories/order.repository";
import { UpdateOrderStatusDto } from "../application/dto/order-status.dto";
import { OrderQueryUseCase } from "../application/use-cases/order-query.use-case";
import { OrderStatusUseCase } from "../application/use-cases/order-status.use-case";

@ApiTags("merchant/orders")
@Controller("merchant")
export class MerchantOrderController {
  constructor(
    private readonly orderQuery: OrderQueryUseCase,
    private readonly orderStatus: OrderStatusUseCase,
  ) {}

  @RequirePermission("order.manage")
  @Get("businesses/:businessId/orders")
  list(@Param("businessId") businessId: string, @Query("status") status?: OrderStatus, @Query("cursor") cursor?: string) {
    return this.orderQuery.listForBusiness(businessId, status, cursor);
  }

  // Note the route is scoped by :businessId (order.accept is a business-scoped permission,
  // Architecture §9) even though the resource path reads "merchant/orders/:id" in API
  // Design §4.7 — PermissionGuard needs :businessId in the URL to check a business-scoped
  // grant, so it's nested here rather than a flat /merchant/orders/:id.
  @RequirePermission("order.accept")
  @UseInterceptors(IdempotencyInterceptor)
  @Patch("businesses/:businessId/orders/:orderId/status")
  updateStatus(
    @Param("businessId") businessId: string,
    @Param("orderId") orderId: string,
    @Body() dto: UpdateOrderStatusDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.orderStatus.merchantTransition(businessId, orderId, dto.status, user.userId, dto.note);
  }
}
