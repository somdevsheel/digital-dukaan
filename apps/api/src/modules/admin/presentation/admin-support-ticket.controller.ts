import { Body, Controller, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { RequirePermission } from "../../../common/decorators/require-permission.decorator";
import type { AuthenticatedUser } from "../../../common/types/authenticated-user";
import type { TicketPriority, TicketStatus } from "../domain/repositories/support-ticket.repository";
import { AddTicketMessageDto, UpdateTicketStatusDto } from "../application/dto/support-ticket.dto";
import { SupportTicketUseCase } from "../application/use-cases/support-ticket.use-case";

@ApiTags("admin/support-tickets")
@Controller("admin/support-tickets")
@RequirePermission("support.manage")
export class AdminSupportTicketController {
  constructor(private readonly tickets: SupportTicketUseCase) {}

  @Get()
  list(@Query("status") status?: TicketStatus, @Query("priority") priority?: TicketPriority, @Query("cursor") cursor?: string) {
    return this.tickets.listForAdmin(status, priority, cursor);
  }

  @Post(":id/messages")
  reply(@CurrentUser() admin: AuthenticatedUser, @Param("id") id: string, @Body() dto: AddTicketMessageDto) {
    return this.tickets.addAdminMessage(admin.userId, id, dto.message);
  }

  @Patch(":id/status")
  updateStatus(@CurrentUser() admin: AuthenticatedUser, @Param("id") id: string, @Body() dto: UpdateTicketStatusDto) {
    return this.tickets.updateStatus(id, dto.status, admin.userId);
  }
}
