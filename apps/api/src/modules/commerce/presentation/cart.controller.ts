import { Body, Controller, Delete, Get, Param, Patch, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../../../common/types/authenticated-user";
import { AddCartItemDto, UpdateCartItemDto } from "../application/dto/cart-item.dto";
import { ApplyCouponDto } from "../application/dto/apply-coupon.dto";
import { CartUseCase } from "../application/use-cases/cart.use-case";

// One active cart per (user, business) — the URL is scoped by :businessId, not a cart id
// (API Design §4.4); item-level operations resolve the caller's active cart for this
// business first, then delegate to it.
@ApiTags("cart")
@Controller("carts/:businessId")
export class CartController {
  constructor(private readonly cart: CartUseCase) {}

  @Get()
  getOrCreate(@CurrentUser() user: AuthenticatedUser, @Param("businessId") businessId: string) {
    return this.cart.getOrCreate(user.userId, businessId);
  }

  @Post("items")
  addItem(@CurrentUser() user: AuthenticatedUser, @Param("businessId") businessId: string, @Body() dto: AddCartItemDto) {
    return this.cart.addItem(user.userId, businessId, dto.productVariantId, dto.quantity);
  }

  @Patch("items/:itemId")
  async updateItem(
    @CurrentUser() user: AuthenticatedUser,
    @Param("businessId") businessId: string,
    @Param("itemId") itemId: string,
    @Body() dto: UpdateCartItemDto,
  ) {
    const cart = await this.cart.getOrCreate(user.userId, businessId);
    return this.cart.updateItemQuantity(user.userId, cart.id, itemId, dto.quantity);
  }

  @Delete("items/:itemId")
  async removeItem(@CurrentUser() user: AuthenticatedUser, @Param("businessId") businessId: string, @Param("itemId") itemId: string) {
    const cart = await this.cart.getOrCreate(user.userId, businessId);
    return this.cart.removeItem(user.userId, cart.id, itemId);
  }

  @Post("apply-coupon")
  applyCoupon(@CurrentUser() user: AuthenticatedUser, @Param("businessId") businessId: string, @Body() dto: ApplyCouponDto) {
    return this.cart.previewCoupon(user.userId, businessId, dto.code);
  }
}
