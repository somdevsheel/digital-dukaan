import { Module } from "@nestjs/common";
import { IdentityModule } from "../identity/identity.module";
import { BusinessModule } from "../business/business.module";
import { PaymentsModule } from "../payments/payments.module";

import { CART_REPOSITORY } from "./domain/repositories/cart.repository";
import { ORDER_REPOSITORY } from "./domain/repositories/order.repository";
import { COUPON_REPOSITORY } from "./domain/repositories/coupon.repository";
import { SALES_ANALYTICS_REPOSITORY } from "./domain/repositories/sales-analytics.repository";

import { PrismaCartRepository } from "./infrastructure/persistence/prisma-cart.repository";
import { PrismaOrderRepository } from "./infrastructure/persistence/prisma-order.repository";
import { PrismaCouponRepository } from "./infrastructure/persistence/prisma-coupon.repository";
import { PrismaSalesAnalyticsRepository } from "./infrastructure/persistence/prisma-sales-analytics.repository";

import { CartUseCase } from "./application/use-cases/cart.use-case";
import { ValidateCouponUseCase } from "./application/use-cases/validate-coupon.use-case";
import { MerchantCouponUseCase } from "./application/use-cases/merchant-coupon.use-case";
import { CheckoutUseCase } from "./application/use-cases/checkout.use-case";
import { OrderStatusUseCase } from "./application/use-cases/order-status.use-case";
import { OrderQueryUseCase } from "./application/use-cases/order-query.use-case";
import { SalesAnalyticsUseCase } from "./application/use-cases/sales-analytics.use-case";

import { CartController } from "./presentation/cart.controller";
import { OrderController } from "./presentation/order.controller";
import { MerchantOrderController } from "./presentation/merchant-order.controller";
import { MerchantCouponController } from "./presentation/merchant-coupon.controller";
import { MerchantAnalyticsController } from "./presentation/merchant-analytics.controller";

@Module({
  // IdentityModule: ADDRESS_REPOSITORY (checkout validates delivery address ownership).
  // BusinessModule: BUSINESS_REPOSITORY + PRODUCT_REPOSITORY (live pricing/stock at checkout).
  // PaymentsModule: payment-intent creation + refund initiation on cancel.
  imports: [IdentityModule, BusinessModule, PaymentsModule],
  controllers: [CartController, OrderController, MerchantOrderController, MerchantCouponController, MerchantAnalyticsController],
  providers: [
    { provide: CART_REPOSITORY, useClass: PrismaCartRepository },
    { provide: ORDER_REPOSITORY, useClass: PrismaOrderRepository },
    { provide: COUPON_REPOSITORY, useClass: PrismaCouponRepository },
    { provide: SALES_ANALYTICS_REPOSITORY, useClass: PrismaSalesAnalyticsRepository },

    CartUseCase,
    ValidateCouponUseCase,
    MerchantCouponUseCase,
    CheckoutUseCase,
    OrderStatusUseCase,
    OrderQueryUseCase,
    SalesAnalyticsUseCase,
  ],
  // OrderStatusUseCase: Delivery module's OTP-completion handler calls markDeliveredByPartner.
  exports: [ORDER_REPOSITORY, OrderStatusUseCase],
})
export class CommerceModule {}
