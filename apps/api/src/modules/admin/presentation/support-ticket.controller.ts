import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../../../common/types/authenticated-user";
import { AddTicketMessageDto, CreateTicketDto } from "../application/dto/support-ticket.dto";
import { SupportTicketUseCase } from "../application/use-cases/support-ticket.use-case";

@ApiTags("support-tickets")
@Controller("support-tickets")
export class SupportTicketController {
  constructor(private readonly tickets: SupportTicketUseCase) {}

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateTicketDto) {
    return this.tickets.create(user.userId, dto);
  }

  @Get()
  listMine(@CurrentUser() user: AuthenticatedUser, @Query("cursor") cursor?: string) {
    return this.tickets.listMine(user.userId, cursor);
  }

  @Get(":id")
  getById(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.tickets.getForUser(user.userId, id);
  }

  @Post(":id/messages")
  addMessage(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() dto: AddTicketMessageDto) {
    return this.tickets.addMessage(user.userId, id, dto.message);
  }
}
