import { Inject, Injectable } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import {
  SERVICE_REQUEST_REPOSITORY,
  type ServiceRequestRecord,
  type ServiceRequestRepository,
  type ServiceRequestStatus,
} from "../../domain/repositories/service-request.repository";
import { SERVICE_REPOSITORY, type ServiceRepository } from "../../../business/domain/repositories/service.repository";
import { BUSINESS_REPOSITORY, type BusinessRepository } from "../../../business/domain/repositories/business.repository";
import { ForbiddenException, NotFoundException } from "../../../../common/errors/app.errors";
import { BusinessNotVerifiedException } from "../../../business/domain/errors/business.errors";
import { ServiceRequestAlreadyRespondedException, ServiceRequestNotFoundException } from "../../domain/errors/booking.errors";
import type { CreateServiceRequestDto } from "../dto/service-request.dto";

@Injectable()
export class ServiceRequestUseCase {
  constructor(
    @Inject(SERVICE_REQUEST_REPOSITORY) private readonly requests: ServiceRequestRepository,
    @Inject(SERVICE_REPOSITORY) private readonly services: ServiceRepository,
    @Inject(BUSINESS_REPOSITORY) private readonly businesses: BusinessRepository,
    private readonly events: EventEmitter2,
  ) {}

  async create(userId: string, dto: CreateServiceRequestDto): Promise<ServiceRequestRecord> {
    const business = await this.businesses.findById(dto.businessId);
    if (!business || business.verificationStatus !== "VERIFIED") throw new BusinessNotVerifiedException();

    if (dto.serviceId) {
      const service = await this.services.findById(dto.serviceId);
      if (!service || service.businessId !== dto.businessId) throw new NotFoundException("Service");
    }

    const request = await this.requests.create(userId, dto.businessId, {
      serviceId: dto.serviceId,
      preferredDate: new Date(dto.preferredDate),
      preferredTimeWindow: dto.preferredTimeWindow,
      notes: dto.notes,
    });

    // Notifications module listens for this to alert the business — a request sitting
    // unseen defeats the entire point of the enquiry flow (same "missed order" concern
    // as Commerce's order-placed notification).
    this.events.emit("service_request.created", { requestId: request.id, businessId: dto.businessId });
    return request;
  }

  async getForUser(userId: string, id: string): Promise<ServiceRequestRecord> {
    const request = await this.requests.findById(id);
    if (!request) throw new ServiceRequestNotFoundException();
    if (request.userId !== userId) throw new ForbiddenException();
    return request;
  }

  listForUser(userId: string, cursor?: string): Promise<ServiceRequestRecord[]> {
    return this.requests.listForUser(userId, cursor);
  }

  listForBusiness(businessId: string, status?: ServiceRequestStatus, cursor?: string): Promise<ServiceRequestRecord[]> {
    return this.requests.listForBusiness(businessId, status, cursor);
  }

  async respond(businessId: string, id: string, status: "CONFIRMED" | "DECLINED"): Promise<ServiceRequestRecord> {
    const request = await this.requests.findById(id);
    if (!request) throw new ServiceRequestNotFoundException();
    if (request.businessId !== businessId) throw new ForbiddenException();
    if (request.status !== "REQUESTED") throw new ServiceRequestAlreadyRespondedException();

    const updated = await this.requests.respond(id, status);
    this.events.emit("service_request.responded", { requestId: id, status });
    return updated;
  }
}
