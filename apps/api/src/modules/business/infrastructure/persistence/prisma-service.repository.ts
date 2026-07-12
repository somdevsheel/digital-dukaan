import { Injectable } from "@nestjs/common";
import type { Service, ServiceImage } from "@prisma/client";
import { PrismaService as PrismaClientService } from "../../../../common/prisma/prisma.service";
import type {
  CreateServiceInput,
  ServiceImageRecord,
  ServiceRecord,
  ServiceRepository,
  UpdateServiceInput,
} from "../../domain/repositories/service.repository";

type ServiceWithImages = Service & { images: ServiceImage[] };

@Injectable()
export class PrismaServiceRepository implements ServiceRepository {
  constructor(private readonly prisma: PrismaClientService) {}

  async listForBusiness(businessId: string, categoryId?: string): Promise<ServiceRecord[]> {
    const services = await this.prisma.service.findMany({
      where: { businessId, deletedAt: null, isActive: true, ...(categoryId ? { categoryId } : {}) },
      orderBy: { createdAt: "desc" },
      include: { images: { orderBy: { sortOrder: "asc" } } },
    });
    return services.map((s) => this.toRecord(s));
  }

  async findById(id: string): Promise<ServiceRecord | null> {
    const service = await this.prisma.service.findUnique({
      where: { id, deletedAt: null },
      include: { images: { orderBy: { sortOrder: "asc" } } },
    });
    return service ? this.toRecord(service) : null;
  }

  async create(businessId: string, input: CreateServiceInput): Promise<ServiceRecord> {
    const service = await this.prisma.service.create({
      data: { businessId, ...input },
      include: { images: true },
    });
    return this.toRecord(service);
  }

  async update(id: string, input: UpdateServiceInput): Promise<ServiceRecord> {
    const service = await this.prisma.service.update({
      where: { id },
      data: input,
      include: { images: { orderBy: { sortOrder: "asc" } } },
    });
    return this.toRecord(service);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.service.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
  }

  async addImage(serviceId: string, url: string, sortOrder: number): Promise<ServiceImageRecord> {
    return this.prisma.serviceImage.create({ data: { serviceId, url, sortOrder } });
  }

  async removeImage(imageId: string): Promise<void> {
    await this.prisma.serviceImage.delete({ where: { id: imageId } });
  }

  private toRecord(service: ServiceWithImages): ServiceRecord {
    return {
      id: service.id,
      businessId: service.businessId,
      categoryId: service.categoryId,
      name: service.name,
      description: service.description,
      pricePaise: service.pricePaise,
      durationMinutes: service.durationMinutes,
      isActive: service.isActive,
      images: service.images,
    };
  }
}
