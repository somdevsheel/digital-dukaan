import { Body, Controller, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../../../common/types/authenticated-user";
import { CreateDisputeDto } from "../application/dto/dispute.dto";
import { DisputeUseCase } from "../application/use-cases/dispute.use-case";

@ApiTags("disputes")
@Controller("disputes")
export class DisputeController {
  constructor(private readonly disputes: DisputeUseCase) {}

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateDisputeDto) {
    return this.disputes.create(user.userId, dto);
  }
}
