import { Module } from "@nestjs/common";
import { BusinessModule } from "../business/business.module";
import { SERVICE_REQUEST_REPOSITORY } from "./domain/repositories/service-request.repository";
import { PrismaServiceRequestRepository } from "./infrastructure/persistence/prisma-service-request.repository";
import { ServiceRequestUseCase } from "./application/use-cases/service-request.use-case";
import { ServiceRequestController } from "./presentation/service-request.controller";
import { MerchantServiceRequestController } from "./presentation/merchant-service-request.controller";

@Module({
  imports: [BusinessModule],
  controllers: [ServiceRequestController, MerchantServiceRequestController],
  providers: [{ provide: SERVICE_REQUEST_REPOSITORY, useClass: PrismaServiceRequestRepository }, ServiceRequestUseCase],
})
export class BookingModule {}
