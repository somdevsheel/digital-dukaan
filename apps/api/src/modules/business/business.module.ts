import { Module } from "@nestjs/common";
import { IdentityModule } from "../identity/identity.module";

import { BUSINESS_REPOSITORY } from "./domain/repositories/business.repository";
import { TAXONOMY_REPOSITORY } from "./domain/repositories/taxonomy.repository";
import { BUSINESS_DOCUMENT_REPOSITORY } from "./domain/repositories/business-document.repository";
import { BUSINESS_BANK_DETAIL_REPOSITORY } from "./domain/repositories/business-bank-detail.repository";
import { BUSINESS_HOUR_REPOSITORY } from "./domain/repositories/business-hour.repository";
import { BUSINESS_MEDIA_REPOSITORY } from "./domain/repositories/business-media.repository";
import { CATEGORY_REPOSITORY } from "./domain/repositories/category.repository";
import { PRODUCT_REPOSITORY } from "./domain/repositories/product.repository";
import { SERVICE_REPOSITORY } from "./domain/repositories/service.repository";
import { STAFF_REPOSITORY } from "./domain/repositories/staff.repository";
import { BUSINESS_SEARCH_PORT } from "./domain/services/business-search.port";

import { PrismaBusinessRepository } from "./infrastructure/persistence/prisma-business.repository";
import { PrismaTaxonomyRepository } from "./infrastructure/persistence/prisma-taxonomy.repository";
import { PrismaBusinessDocumentRepository } from "./infrastructure/persistence/prisma-business-document.repository";
import { PrismaBusinessBankDetailRepository } from "./infrastructure/persistence/prisma-business-bank-detail.repository";
import { PrismaBusinessHourRepository } from "./infrastructure/persistence/prisma-business-hour.repository";
import { PrismaBusinessMediaRepository } from "./infrastructure/persistence/prisma-business-media.repository";
import { PrismaCategoryRepository } from "./infrastructure/persistence/prisma-category.repository";
import { PrismaProductRepository } from "./infrastructure/persistence/prisma-product.repository";
import { PrismaServiceRepository } from "./infrastructure/persistence/prisma-service.repository";
import { PrismaStaffRepository } from "./infrastructure/persistence/prisma-staff.repository";
import { PostgresBusinessSearchAdapter } from "./infrastructure/search/postgres-business-search.adapter";

import { RegisterBusinessUseCase } from "./application/use-cases/register-business.use-case";
import { BusinessProfileUseCase } from "./application/use-cases/business-profile.use-case";
import { DiscoveryUseCase } from "./application/use-cases/discovery.use-case";
import { CategoryUseCase } from "./application/use-cases/category.use-case";
import { ProductUseCase } from "./application/use-cases/product.use-case";
import { ServiceOfferingUseCase } from "./application/use-cases/service-offering.use-case";
import { StaffUseCase } from "./application/use-cases/staff.use-case";
import { AdminBusinessUseCase } from "./application/use-cases/admin-business.use-case";

import { DiscoveryController } from "./presentation/discovery.controller";
import { MerchantBusinessController } from "./presentation/merchant-business.controller";
import { MerchantCatalogController } from "./presentation/merchant-catalog.controller";
import { MerchantStaffController } from "./presentation/merchant-staff.controller";
import { AdminBusinessController } from "./presentation/admin-business.controller";

@Module({
  // IdentityModule: this module's Staff/RegisterBusiness use cases reach into Identity's
  // exported USER_REPOSITORY/ROLE_REPOSITORY/TOKEN_ISSUER — the two pragmatic exceptions
  // documented in staff.repository.ts and register-business.use-case.ts.
  imports: [IdentityModule],
  controllers: [
    DiscoveryController,
    MerchantBusinessController,
    MerchantCatalogController,
    MerchantStaffController,
    AdminBusinessController,
  ],
  providers: [
    { provide: BUSINESS_REPOSITORY, useClass: PrismaBusinessRepository },
    { provide: TAXONOMY_REPOSITORY, useClass: PrismaTaxonomyRepository },
    { provide: BUSINESS_DOCUMENT_REPOSITORY, useClass: PrismaBusinessDocumentRepository },
    { provide: BUSINESS_BANK_DETAIL_REPOSITORY, useClass: PrismaBusinessBankDetailRepository },
    { provide: BUSINESS_HOUR_REPOSITORY, useClass: PrismaBusinessHourRepository },
    { provide: BUSINESS_MEDIA_REPOSITORY, useClass: PrismaBusinessMediaRepository },
    { provide: CATEGORY_REPOSITORY, useClass: PrismaCategoryRepository },
    { provide: PRODUCT_REPOSITORY, useClass: PrismaProductRepository },
    { provide: SERVICE_REPOSITORY, useClass: PrismaServiceRepository },
    { provide: STAFF_REPOSITORY, useClass: PrismaStaffRepository },
    // Swap to a MeilisearchBusinessSearchAdapter once the worker-side indexer pipeline
    // exists (Architecture §11) — everything above the port boundary is unaffected.
    { provide: BUSINESS_SEARCH_PORT, useClass: PostgresBusinessSearchAdapter },

    RegisterBusinessUseCase,
    BusinessProfileUseCase,
    DiscoveryUseCase,
    CategoryUseCase,
    ProductUseCase,
    ServiceOfferingUseCase,
    StaffUseCase,
    AdminBusinessUseCase,
  ],
  // SERVICE_REPOSITORY: Booking module validates a requested service belongs to the business.
  exports: [BUSINESS_REPOSITORY, PRODUCT_REPOSITORY, SERVICE_REPOSITORY],
})
export class BusinessModule {}
