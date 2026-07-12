import { randomUUID } from "node:crypto";
import { Inject, Injectable } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import {
  SERVICE_REPOSITORY,
  type ServiceImageRecord,
  type ServiceRecord,
  type ServiceRepository,
} from "../../domain/repositories/service.repository";
import { STORAGE_PORT, type StoragePort } from "../../../../common/storage/storage.port";
import { ForbiddenException, NotFoundException } from "../../../../common/errors/app.errors";
import type { CreateServiceDto, UpdateServiceDto } from "../dto/service.dto";

// Named ServiceOfferingUseCase (not "ServiceUseCase") to avoid the every-file ambiguity
// of "Service" meaning both "the domain concept of an appointment-based offering" and
// "an injectable NestJS provider" — this class is the former.
@Injectable()
export class ServiceOfferingUseCase {
  constructor(
    @Inject(SERVICE_REPOSITORY) private readonly services: ServiceRepository,
    @Inject(STORAGE_PORT) private readonly storage: StoragePort,
    private readonly events: EventEmitter2,
  ) {}

  list(businessId: string, categoryId?: string): Promise<ServiceRecord[]> {
    return this.services.listForBusiness(businessId, categoryId);
  }

  async create(businessId: string, dto: CreateServiceDto): Promise<ServiceRecord> {
    const service = await this.services.create(businessId, dto);
    this.events.emit("service.upserted", { serviceId: service.id, businessId });
    return service;
  }

  async update(businessId: string, serviceId: string, dto: UpdateServiceDto): Promise<ServiceRecord> {
    await this.assertOwned(businessId, serviceId);
    const service = await this.services.update(serviceId, dto);
    this.events.emit("service.upserted", { serviceId: service.id, businessId });
    return service;
  }

  async remove(businessId: string, serviceId: string): Promise<void> {
    await this.assertOwned(businessId, serviceId);
    await this.services.delete(serviceId);
    this.events.emit("service.deleted", { serviceId, businessId });
  }

  async createImageUploadUrl(businessId: string, serviceId: string, fileName: string, contentType: string) {
    await this.assertOwned(businessId, serviceId);
    const key = `businesses/${businessId}/services/${serviceId}/${randomUUID()}-${fileName}`;
    return this.storage.getPresignedUploadUrl(key, contentType);
  }

  async addImage(businessId: string, serviceId: string, url: string, sortOrder: number): Promise<ServiceImageRecord> {
    await this.assertOwned(businessId, serviceId);
    return this.services.addImage(serviceId, url, sortOrder);
  }

  async removeImage(businessId: string, serviceId: string, imageId: string): Promise<void> {
    await this.assertOwned(businessId, serviceId);
    await this.services.removeImage(imageId);
  }

  private async assertOwned(businessId: string, serviceId: string): Promise<ServiceRecord> {
    const service = await this.services.findById(serviceId);
    if (!service) throw new NotFoundException("Service");
    if (service.businessId !== businessId) throw new ForbiddenException();
    return service;
  }
}
