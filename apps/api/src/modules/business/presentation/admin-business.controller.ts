import { Body, Controller, Get, Param, Patch, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { RequirePermission } from "../../../common/decorators/require-permission.decorator";
import type { AuthenticatedUser } from "../../../common/types/authenticated-user";
import type { VerificationStatus } from "../domain/repositories/business.repository";
import { SuspendBusinessDto, VerifyBusinessDto } from "../application/dto/verify-business.dto";
import { AdminBusinessUseCase } from "../application/use-cases/admin-business.use-case";

@ApiTags("admin/business")
@Controller("admin/businesses")
@RequirePermission("business.verify")
export class AdminBusinessController {
  constructor(private readonly adminBusiness: AdminBusinessUseCase) {}

  @Get()
  list(
    @Query("status") status?: VerificationStatus,
    @Query("cityId") cityId?: string,
    @Query("businessTypeId") businessTypeId?: string,
    @Query("cursor") cursor?: string,
    @Query("limit") limit?: string,
  ) {
    return this.adminBusiness.list(
      { status, cityId, businessTypeId },
      cursor,
      limit ? parseInt(limit, 10) : undefined,
    );
  }

  @Get("count")
  count(@Query("status") status?: VerificationStatus) {
    return this.adminBusiness.count({ status });
  }

  @Patch(":id/verify")
  verify(@Param("id") id: string, @Body() dto: VerifyBusinessDto, @CurrentUser() admin: AuthenticatedUser) {
    return this.adminBusiness.setVerificationStatus(id, dto.status, admin.userId, dto.reason);
  }

  @Patch(":id/suspend")
  suspend(@Param("id") id: string, @Body() dto: SuspendBusinessDto, @CurrentUser() admin: AuthenticatedUser) {
    return this.adminBusiness.setSuspension(id, dto.suspend, admin.userId);
  }
}
