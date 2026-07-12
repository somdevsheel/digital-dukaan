import { Body, Controller, Get, Patch, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../../../common/types/authenticated-user";
import { RegisterDeliveryPartnerDto } from "../application/dto/delivery-partner.dto";
import { UpdateAvailabilityDto, UpdateLocationDto } from "../application/dto/availability.dto";
import { DeliveryPartnerUseCase } from "../application/use-cases/delivery-partner.use-case";

@ApiTags("delivery-partners")
@Controller("delivery-partners")
export class DeliveryPartnerController {
  constructor(private readonly partners: DeliveryPartnerUseCase) {}

  @Post("register")
  register(@CurrentUser() user: AuthenticatedUser, @Body() dto: RegisterDeliveryPartnerDto) {
    return this.partners.register(user.userId, dto);
  }

  @Get("me")
  getMine(@CurrentUser() user: AuthenticatedUser) {
    return this.partners.getMine(user.userId);
  }

  @Patch("me/availability")
  setAvailability(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateAvailabilityDto) {
    return this.partners.setAvailability(user.userId, dto.isAvailable);
  }

  @Patch("me/location")
  async updateLocation(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateLocationDto): Promise<{ updated: true }> {
    await this.partners.updateLocation(user.userId, dto.latitude, dto.longitude);
    return { updated: true };
  }
}
