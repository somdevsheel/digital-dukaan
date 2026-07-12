import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { RequirePermission } from "../../../common/decorators/require-permission.decorator";
import { InviteStaffDto } from "../application/dto/invite-staff.dto";
import { StaffUseCase } from "../application/use-cases/staff.use-case";

// staff.manage is owner-only per the seeded RBAC grants (Database Design §7 seed) —
// BUSINESS_STAFF is never granted this permission.
@ApiTags("merchant/staff")
@Controller("merchant/businesses/:businessId/staff")
@RequirePermission("staff.manage")
export class MerchantStaffController {
  constructor(private readonly staff: StaffUseCase) {}

  @Get()
  list(@Param("businessId") businessId: string) {
    return this.staff.list(businessId);
  }

  @Post("invite")
  invite(@Param("businessId") businessId: string, @Body() dto: InviteStaffDto) {
    return this.staff.invite(businessId, dto);
  }

  @Delete(":userRoleId")
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param("userRoleId") userRoleId: string): Promise<void> {
    await this.staff.remove(userRoleId);
  }
}
