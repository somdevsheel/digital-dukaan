import { Body, Controller, Get, Param, Patch, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { RequirePermission } from "../../../common/decorators/require-permission.decorator";
import type { ServiceRequestStatus } from "../domain/repositories/service-request.repository";
import { RespondToServiceRequestDto } from "../application/dto/service-request.dto";
import { ServiceRequestUseCase } from "../application/use-cases/service-request.use-case";

@ApiTags("merchant/service-requests")
@Controller("merchant/businesses/:businessId/service-requests")
@RequirePermission("order.manage")
export class MerchantServiceRequestController {
  constructor(private readonly serviceRequests: ServiceRequestUseCase) {}

  @Get()
  list(@Param("businessId") businessId: string, @Query("status") status?: ServiceRequestStatus, @Query("cursor") cursor?: string) {
    return this.serviceRequests.listForBusiness(businessId, status, cursor);
  }

  @Patch(":requestId")
  respond(
    @Param("businessId") businessId: string,
    @Param("requestId") requestId: string,
    @Body() dto: RespondToServiceRequestDto,
  ) {
    return this.serviceRequests.respond(businessId, requestId, dto.status);
  }
}
