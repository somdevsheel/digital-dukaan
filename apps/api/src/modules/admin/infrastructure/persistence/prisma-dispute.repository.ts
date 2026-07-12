import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../../common/prisma/prisma.service";
import type { DisputeRecord, DisputeRepository, DisputeStatus, DisputeType } from "../../domain/repositories/dispute.repository";

@Injectable()
export class PrismaDisputeRepository implements DisputeRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(orderId: string, raisedByUserId: string, type: DisputeType): Promise<DisputeRecord> {
    return this.prisma.dispute.create({ data: { orderId, raisedByUserId, type } });
  }

  findById(id: string): Promise<DisputeRecord | null> {
    return this.prisma.dispute.findUnique({ where: { id } });
  }

  listForAdmin(status?: DisputeStatus, cursor?: string, limit = 20): Promise<DisputeRecord[]> {
    return this.prisma.dispute.findMany({
      where: status ? { status } : {},
      orderBy: { createdAt: "desc" },
      take: limit,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
  }

  resolve(id: string, status: "RESOLVED" | "REJECTED", resolutionNote: string, resolvedBy: string): Promise<DisputeRecord> {
    return this.prisma.dispute.update({
      where: { id },
      data: { status, resolutionNote, resolvedBy, resolvedAt: new Date() },
    });
  }
}
