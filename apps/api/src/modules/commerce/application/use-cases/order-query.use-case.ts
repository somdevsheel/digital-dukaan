import { Inject, Injectable } from "@nestjs/common";
import {
  ORDER_REPOSITORY,
  type OrderRecord,
  type OrderRepository,
  type OrderStatus,
  type OrderStatusHistoryRecord,
} from "../../domain/repositories/order.repository";
import { ForbiddenException } from "../../../../common/errors/app.errors";
import { OrderNotFoundException } from "../../domain/errors/commerce.errors";

@Injectable()
export class OrderQueryUseCase {
  constructor(@Inject(ORDER_REPOSITORY) private readonly orders: OrderRepository) {}

  async getByIdForCustomer(userId: string, orderId: string): Promise<OrderRecord> {
    const order = await this.orders.findById(orderId);
    if (!order) throw new OrderNotFoundException();
    if (order.userId !== userId) throw new ForbiddenException();
    return order;
  }

  async getTrackingInfo(userId: string, orderId: string): Promise<{ order: OrderRecord; history: OrderStatusHistoryRecord[] }> {
    const order = await this.getByIdForCustomer(userId, orderId);
    const history = await this.orders.getStatusHistory(orderId);
    return { order, history };
  }

  listMine(userId: string, cursor?: string, limit?: number): Promise<OrderRecord[]> {
    return this.orders.listForUser(userId, cursor, limit);
  }

  listForBusiness(businessId: string, status?: OrderStatus, cursor?: string, limit?: number): Promise<OrderRecord[]> {
    return this.orders.listForBusiness(businessId, status, cursor, limit);
  }
}
