import { Module } from "@nestjs/common";
import { CommerceModule } from "../commerce/commerce.module";
import { REVIEW_REPOSITORY } from "./domain/repositories/review.repository";
import { PrismaReviewRepository } from "./infrastructure/persistence/prisma-review.repository";
import { ReviewUseCase } from "./application/use-cases/review.use-case";
import { ReviewController } from "./presentation/review.controller";

@Module({
  imports: [CommerceModule], // ORDER_REPOSITORY — validates the order is the reviewer's and is DELIVERED/COMPLETED
  controllers: [ReviewController],
  providers: [{ provide: REVIEW_REPOSITORY, useClass: PrismaReviewRepository }, ReviewUseCase],
})
export class ReviewsModule {}
