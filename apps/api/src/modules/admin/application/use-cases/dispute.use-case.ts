import { Inject, Injectable } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { DISPUTE_REPOSITORY, type DisputeRecord, type DisputeRepository, type DisputeStatus } from "../../domain/repositories/dispute.repository";
import { ORDER_REPOSITORY, type OrderRepository } from "../../../commerce/domain/repositories/order.repository";
import { ForbiddenException, NotFoundException } from "../../../../common/errors/app.errors";
import { DisputeNotFoundException } from "../../domain/errors/admin.errors";
import type { CreateDisputeDto } from "../dto/dispute.dto";

@Injectable()
export class DisputeUseCase {
  constructor(
    @Inject(DISPUTE_REPOSITORY) private readonly disputes: DisputeRepository,
    @Inject(ORDER_REPOSITORY) private readonly orders: OrderRepository,
    private readonly events: EventEmitter2,
  ) {}

  async create(userId: string, dto: CreateDisputeDto): Promise<DisputeRecord> {
    const order = await this.orders.findById(dto.orderId);
    if (!order) throw new NotFoundException("Order");
    if (order.userId !== userId) throw new ForbiddenException();

    const dispute = await this.disputes.create(dto.orderId, userId, dto.type);
    this.events.emit("dispute.created", { disputeId: dispute.id, orderId: dto.orderId });
    return dispute;
  }

  listForAdmin(status?: DisputeStatus, cursor?: string): Promise<DisputeRecord[]> {
    return this.disputes.listForAdmin(status, cursor);
  }

  async resolve(id: string, status: "RESOLVED" | "REJECTED", resolutionNote: string, adminUserId: string): Promise<DisputeRecord> {
    const dispute = await this.disputes.findById(id);
    if (!dispute) throw new DisputeNotFoundException();

    const resolved = await this.disputes.resolve(id, status, resolutionNote, adminUserId);
    this.events.emit("dispute.resolved", { disputeId: id, status, adminUserId });
    return resolved;
  }
}
