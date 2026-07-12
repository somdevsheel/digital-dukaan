import { Module } from "@nestjs/common";
import { IdentityModule } from "../identity/identity.module";
import { CommerceModule } from "../commerce/commerce.module";

import { DELIVERY_PARTNER_REPOSITORY } from "./domain/repositories/delivery-partner.repository";
import { DELIVERY_REPOSITORY } from "./domain/repositories/delivery.repository";
import { DELIVERY_EARNING_REPOSITORY } from "./domain/repositories/delivery-earning.repository";
import { CASH_COLLECTION_REPOSITORY } from "./domain/repositories/cash-collection.repository";

import { PrismaDeliveryPartnerRepository } from "./infrastructure/persistence/prisma-delivery-partner.repository";
import { PrismaDeliveryRepository } from "./infrastructure/persistence/prisma-delivery.repository";
import { PrismaDeliveryEarningRepository } from "./infrastructure/persistence/prisma-delivery-earning.repository";
import { PrismaCashCollectionRepository } from "./infrastructure/persistence/prisma-cash-collection.repository";

import { DeliveryPartnerUseCase } from "./application/use-cases/delivery-partner.use-case";
import { DeliveryUseCase } from "./application/use-cases/delivery.use-case";
import { WalletUseCase } from "./application/use-cases/wallet.use-case";
import { DeliveryCreationListener } from "./application/listeners/delivery-creation.listener";

import { DeliveryPartnerController } from "./presentation/delivery-partner.controller";
import { DeliveryController } from "./presentation/delivery.controller";

@Module({
  // IdentityModule: PASSWORD_HASHER (delivery OTP hashing). CommerceModule:
  // ORDER_REPOSITORY (read order state, COD check) + OrderStatusUseCase (pickup/delivered transitions).
  imports: [IdentityModule, CommerceModule],
  controllers: [DeliveryPartnerController, DeliveryController],
  providers: [
    { provide: DELIVERY_PARTNER_REPOSITORY, useClass: PrismaDeliveryPartnerRepository },
    { provide: DELIVERY_REPOSITORY, useClass: PrismaDeliveryRepository },
    { provide: DELIVERY_EARNING_REPOSITORY, useClass: PrismaDeliveryEarningRepository },
    { provide: CASH_COLLECTION_REPOSITORY, useClass: PrismaCashCollectionRepository },

    DeliveryPartnerUseCase,
    DeliveryUseCase,
    WalletUseCase,
    DeliveryCreationListener,
  ],
})
export class DeliveryModule {}
