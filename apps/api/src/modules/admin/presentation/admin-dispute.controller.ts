import { Body, Controller, Get, Param, Patch, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { RequirePermission } from "../../../common/decorators/require-permission.decorator";
import type { AuthenticatedUser } from "../../../common/types/authenticated-user";
import type { DisputeStatus } from "../domain/repositories/dispute.repository";
import { ResolveDisputeDto } from "../application/dto/dispute.dto";
import { DisputeUseCase } from "../application/use-cases/dispute.use-case";

@ApiTags("admin/disputes")
@Controller("admin/disputes")
@RequirePermission("dispute.manage")
export class AdminDisputeController {
  constructor(private readonly disputes: DisputeUseCase) {}

  @Get()
  list(@Query("status") status?: DisputeStatus, @Query("cursor") cursor?: string) {
    return this.disputes.listForAdmin(status, cursor);
  }

  @Patch(":id/resolve")
  resolve(@CurrentUser() admin: AuthenticatedUser, @Param("id") id: string, @Body() dto: ResolveDisputeDto) {
    return this.disputes.resolve(id, dto.status, dto.resolutionNote, admin.userId);
  }
}
