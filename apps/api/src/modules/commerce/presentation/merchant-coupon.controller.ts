import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { RequirePermission } from "../../../common/decorators/require-permission.decorator";
import { CreateCouponDto, UpdateCouponDto } from "../application/dto/coupon.dto";
import { MerchantCouponUseCase } from "../application/use-cases/merchant-coupon.use-case";

@ApiTags("merchant/coupons")
@Controller("merchant/businesses/:businessId/coupons")
@RequirePermission("coupon.manage")
export class MerchantCouponController {
  constructor(private readonly coupons: MerchantCouponUseCase) {}

  @Get()
  list(@Param("businessId") businessId: string) {
    return this.coupons.list(businessId);
  }

  @Post()
  create(@Param("businessId") businessId: string, @Body() dto: CreateCouponDto) {
    return this.coupons.create(businessId, dto);
  }

  @Patch(":couponId")
  update(@Param("businessId") businessId: string, @Param("couponId") couponId: string, @Body() dto: UpdateCouponDto) {
    return this.coupons.update(businessId, couponId, dto);
  }
}
