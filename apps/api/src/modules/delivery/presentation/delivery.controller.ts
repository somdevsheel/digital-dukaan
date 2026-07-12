import { Body, Controller, Get, Param, Post, Query, UseInterceptors } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { IdempotencyInterceptor } from "../../../common/interceptors/idempotency.interceptor";
import type { AuthenticatedUser } from "../../../common/types/authenticated-user";
import { CompleteDeliveryDto } from "../application/dto/complete-delivery.dto";
import { DeliveryUseCase } from "../application/use-cases/delivery.use-case";
import { WalletUseCase } from "../application/use-cases/wallet.use-case";

const DEFAULT_OFFER_RADIUS_METERS = 5000;

@ApiTags("delivery")
@Controller("delivery-partners")
export class DeliveryController {
  constructor(
    private readonly delivery: DeliveryUseCase,
    private readonly wallet: WalletUseCase,
  ) {}

  @Get("me/offers")
  listOffers(
    @CurrentUser() user: AuthenticatedUser,
    @Query("lat") lat: string,
    @Query("lng") lng: string,
    @Query("radiusM") radiusM?: string,
  ) {
    return this.delivery.listOffers(
      user.userId,
      parseFloat(lat),
      parseFloat(lng),
      radiusM ? parseInt(radiusM, 10) : DEFAULT_OFFER_RADIUS_METERS,
    );
  }

  // Idempotency-Key required — a retried tap on a flaky connection must never accept
  // the same delivery twice, and the underlying assign() already resolves the
  // "two partners, one delivery" race independently (Database Design's conditional UPDATE).
  @UseInterceptors(IdempotencyInterceptor)
  @Post("deliveries/:id/accept")
  accept(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.delivery.accept(user.userId, id);
  }

  @Post("deliveries/:id/pickup")
  pickup(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.delivery.markPickedUp(user.userId, id);
  }

  @Post("deliveries/:id/complete")
  complete(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() dto: CompleteDeliveryDto) {
    return this.delivery.completeDelivery(user.userId, id, dto.otp);
  }

  @Get("me/deliveries")
  listMine(@CurrentUser() user: AuthenticatedUser, @Query("cursor") cursor?: string) {
    return this.delivery.listMyDeliveries(user.userId, cursor);
  }

  @Get("me/earnings")
  listEarnings(@CurrentUser() user: AuthenticatedUser, @Query("cursor") cursor?: string) {
    return this.wallet.listEarnings(user.userId, cursor);
  }

  @Get("me/wallet")
  getWallet(@CurrentUser() user: AuthenticatedUser) {
    return this.wallet.getWallet(user.userId);
  }
}
