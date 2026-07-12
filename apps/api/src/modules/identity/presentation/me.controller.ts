import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../../../common/types/authenticated-user";
import { UpdateMeDto } from "../application/dto/update-me.dto";
import { CreateAddressDto, UpdateAddressDto } from "../application/dto/upsert-address.dto";
import { ProfileUseCase } from "../application/use-cases/profile.use-case";
import { AddressUseCase } from "../application/use-cases/address.use-case";

@ApiTags("me")
@Controller("me")
export class MeController {
  constructor(
    private readonly profile: ProfileUseCase,
    private readonly addresses: AddressUseCase,
  ) {}

  @Get()
  getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.profile.getMe(user.userId);
  }

  @Patch()
  updateMe(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateMeDto) {
    return this.profile.updateMe(user.userId, dto);
  }

  @Get("addresses")
  listAddresses(@CurrentUser() user: AuthenticatedUser) {
    return this.addresses.list(user.userId);
  }

  @Post("addresses")
  createAddress(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateAddressDto) {
    return this.addresses.create(user.userId, dto);
  }

  @Patch("addresses/:id")
  updateAddress(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: UpdateAddressDto,
  ) {
    return this.addresses.update(user.userId, id, dto);
  }

  @Delete("addresses/:id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAddress(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string): Promise<void> {
    await this.addresses.remove(user.userId, id);
  }
}
