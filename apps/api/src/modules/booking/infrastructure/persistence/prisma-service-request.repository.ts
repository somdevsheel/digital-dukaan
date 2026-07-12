import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../../common/prisma/prisma.service";
import type {
  CreateServiceRequestInput,
  ServiceRequestRecord,
  ServiceRequestRepository,
  ServiceRequestStatus,
} from "../../domain/repositories/service-request.repository";

@Injectable()
export class PrismaServiceRequestRepository implements ServiceRequestRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(userId: string, businessId: string, input: CreateServiceRequestInput): Promise<ServiceRequestRecord> {
    return this.prisma.serviceRequest.create({
      data: {
        userId,
        businessId,
        ...(input.serviceId !== undefined ? { serviceId: input.serviceId } : {}),
        preferredDate: input.preferredDate,
        preferredTimeWindow: input.preferredTimeWindow,
        ...(input.notes !== undefined ? { notes: input.notes } : {}),
      },
    });
  }

  findById(id: string): Promise<ServiceRequestRecord | null> {
    return this.prisma.serviceRequest.findUnique({ where: { id } });
  }

  listForUser(userId: string, cursor?: string, limit = 20): Promise<ServiceRequestRecord[]> {
    return this.prisma.serviceRequest.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
  }

  listForBusiness(businessId: string, status?: ServiceRequestStatus, cursor?: string, limit = 20): Promise<ServiceRequestRecord[]> {
    return this.prisma.serviceRequest.findMany({
      where: { businessId, ...(status ? { status } : {}) },
      orderBy: { createdAt: "desc" },
      take: limit,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
  }

  respond(id: string, status: "CONFIRMED" | "DECLINED"): Promise<ServiceRequestRecord> {
    return this.prisma.serviceRequest.update({ where: { id }, data: { status, respondedAt: new Date() } });
  }

  cancel(id: string): Promise<ServiceRequestRecord> {
    return this.prisma.serviceRequest.update({ where: { id }, data: { status: "CANCELLED" } });
  }
}
