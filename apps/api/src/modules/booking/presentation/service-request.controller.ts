import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../../../common/types/authenticated-user";
import { CreateServiceRequestDto } from "../application/dto/service-request.dto";
import { ServiceRequestUseCase } from "../application/use-cases/service-request.use-case";

@ApiTags("service-requests")
@Controller()
export class ServiceRequestController {
  constructor(private readonly serviceRequests: ServiceRequestUseCase) {}

  @Post("service-requests")
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateServiceRequestDto) {
    return this.serviceRequests.create(user.userId, dto);
  }

  @Get("service-requests/:id")
  getById(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.serviceRequests.getForUser(user.userId, id);
  }

  @Get("me/service-requests")
  listMine(@CurrentUser() user: AuthenticatedUser, @Query("cursor") cursor?: string) {
    return this.serviceRequests.listForUser(user.userId, cursor);
  }
}
