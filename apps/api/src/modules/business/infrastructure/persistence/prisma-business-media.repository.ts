import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../../common/prisma/prisma.service";
import type {
  BusinessMediaRecord,
  BusinessMediaRepository,
  BusinessMediaType,
} from "../../domain/repositories/business-media.repository";

@Injectable()
export class PrismaBusinessMediaRepository implements BusinessMediaRepository {
  constructor(private readonly prisma: PrismaService) {}

  listForBusiness(businessId: string): Promise<BusinessMediaRecord[]> {
    return this.prisma.businessMedia.findMany({ where: { businessId }, orderBy: { sortOrder: "asc" } });
  }

  add(businessId: string, type: BusinessMediaType, url: string, sortOrder: number): Promise<BusinessMediaRecord> {
    return this.prisma.businessMedia.create({ data: { businessId, type, url, sortOrder } });
  }

  async remove(id: string): Promise<void> {
    await this.prisma.businessMedia.delete({ where: { id } });
  }
}
