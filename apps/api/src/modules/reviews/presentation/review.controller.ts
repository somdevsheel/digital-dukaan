import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Public } from "../../../common/decorators/public.decorator";
import { CurrentUser } from "../../../common/decorators/current-user.decorator";
import { RequirePermission } from "../../../common/decorators/require-permission.decorator";
import type { AuthenticatedUser } from "../../../common/types/authenticated-user";
import { CreateReviewDto, ReplyToReviewDto } from "../application/dto/review.dto";
import { ReviewUseCase } from "../application/use-cases/review.use-case";

@ApiTags("reviews")
@Controller()
export class ReviewController {
  constructor(private readonly reviews: ReviewUseCase) {}

  @Post("orders/:orderId/review")
  create(@CurrentUser() user: AuthenticatedUser, @Param("orderId") orderId: string, @Body() dto: CreateReviewDto) {
    return this.reviews.create(user.userId, orderId, dto);
  }

  @Public()
  @Get("businesses/:businessId/reviews")
  listForBusiness(@Param("businessId") businessId: string, @Query("cursor") cursor?: string) {
    return this.reviews.listForBusiness(businessId, cursor);
  }

  @RequirePermission("order.manage")
  @Post("merchant/businesses/:businessId/reviews/:reviewId/reply")
  reply(@Param("businessId") businessId: string, @Param("reviewId") reviewId: string, @Body() dto: ReplyToReviewDto) {
    return this.reviews.reply(businessId, reviewId, dto.message);
  }
}
