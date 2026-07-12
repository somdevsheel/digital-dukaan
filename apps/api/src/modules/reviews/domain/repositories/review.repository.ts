export interface ReviewRecord {
  id: string;
  userId: string;
  businessId: string;
  orderId: string | null;
  rating: number;
  comment: string | null;
  status: "PUBLISHED" | "HIDDEN" | "FLAGGED";
  reply: { message: string; createdAt: Date } | null;
  createdAt: Date;
}

export interface ReviewRepository {
  create(userId: string, businessId: string, orderId: string, rating: number, comment?: string): Promise<ReviewRecord>;
  findByOrderId(orderId: string): Promise<ReviewRecord | null>;
  listForBusiness(businessId: string, cursor?: string, limit?: number): Promise<ReviewRecord[]>;
  addReply(reviewId: string, businessId: string, message: string): Promise<ReviewRecord>;
}

export const REVIEW_REPOSITORY = Symbol("REVIEW_REPOSITORY");
