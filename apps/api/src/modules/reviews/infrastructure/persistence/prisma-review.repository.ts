import { Injectable } from "@nestjs/common";
import type { Review, ReviewReply } from "@prisma/client";
import { PrismaService } from "../../../../common/prisma/prisma.service";
import type { ReviewRecord, ReviewRepository } from "../../domain/repositories/review.repository";
import { NotFoundException } from "../../../../common/errors/app.errors";

type ReviewWithReply = Review & { reply: ReviewReply | null };

@Injectable()
export class PrismaReviewRepository implements ReviewRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, businessId: string, orderId: string, rating: number, comment?: string): Promise<ReviewRecord> {
    const review = await this.prisma.review.create({
      data: { userId, businessId, orderId, rating, ...(comment !== undefined ? { comment } : {}) },
      include: { reply: true },
    });
    return this.toRecord(review);
  }

  async findByOrderId(orderId: string): Promise<ReviewRecord | null> {
    const review = await this.prisma.review.findUnique({ where: { orderId }, include: { reply: true } });
    return review ? this.toRecord(review) : null;
  }

  async listForBusiness(businessId: string, cursor?: string, limit = 20): Promise<ReviewRecord[]> {
    const reviews = await this.prisma.review.findMany({
      where: { businessId, status: "PUBLISHED" },
      orderBy: { createdAt: "desc" },
      take: limit,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: { reply: true },
    });
    return reviews.map((r) => this.toRecord(r));
  }

  async addReply(reviewId: string, businessId: string, message: string): Promise<ReviewRecord> {
    const review = await this.prisma.review.findUnique({ where: { id: reviewId } });
    if (!review || review.businessId !== businessId) throw new NotFoundException("Review");

    await this.prisma.reviewReply.create({ data: { reviewId, businessId, message } });
    const updated = await this.prisma.review.findUniqueOrThrow({ where: { id: reviewId }, include: { reply: true } });
    return this.toRecord(updated);
  }

  private toRecord(review: ReviewWithReply): ReviewRecord {
    return {
      id: review.id,
      userId: review.userId,
      businessId: review.businessId,
      orderId: review.orderId,
      rating: review.rating,
      comment: review.comment,
      status: review.status,
      reply: review.reply ? { message: review.reply.message, createdAt: review.reply.createdAt } : null,
      createdAt: review.createdAt,
    };
  }
}
