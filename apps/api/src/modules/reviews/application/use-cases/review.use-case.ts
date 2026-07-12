import { Inject, Injectable } from "@nestjs/common";
import { REVIEW_REPOSITORY, type ReviewRecord, type ReviewRepository } from "../../domain/repositories/review.repository";
import { ORDER_REPOSITORY, type OrderRepository } from "../../../commerce/domain/repositories/order.repository";
import { ForbiddenException, NotFoundException } from "../../../../common/errors/app.errors";
import { ReviewAlreadyExistsException, ReviewNotAllowedException } from "../../domain/errors/review.errors";
import type { CreateReviewDto } from "../dto/review.dto";

const REVIEWABLE_STATUSES = ["DELIVERED", "COMPLETED"];

@Injectable()
export class ReviewUseCase {
  constructor(
    @Inject(REVIEW_REPOSITORY) private readonly reviews: ReviewRepository,
    @Inject(ORDER_REPOSITORY) private readonly orders: OrderRepository,
  ) {}

  async create(userId: string, orderId: string, dto: CreateReviewDto): Promise<ReviewRecord> {
    const order = await this.orders.findById(orderId);
    if (!order) throw new NotFoundException("Order");
    if (order.userId !== userId) throw new ForbiddenException();
    if (!REVIEWABLE_STATUSES.includes(order.status)) throw new ReviewNotAllowedException();

    const existing = await this.reviews.findByOrderId(orderId);
    if (existing) throw new ReviewAlreadyExistsException();

    return this.reviews.create(userId, order.businessId, orderId, dto.rating, dto.comment);
  }

  listForBusiness(businessId: string, cursor?: string): Promise<ReviewRecord[]> {
    return this.reviews.listForBusiness(businessId, cursor);
  }

  reply(businessId: string, reviewId: string, message: string): Promise<ReviewRecord> {
    return this.reviews.addReply(reviewId, businessId, message);
  }
}
