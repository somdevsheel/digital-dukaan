import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../../common/prisma/prisma.service";
import type { BusinessTypeRecord, CityRecord, TaxonomyRepository } from "../../domain/repositories/taxonomy.repository";

@Injectable()
export class PrismaTaxonomyRepository implements TaxonomyRepository {
  constructor(private readonly prisma: PrismaService) {}

  listBusinessTypes(): Promise<BusinessTypeRecord[]> {
    return this.prisma.businessType.findMany({ orderBy: { sortOrder: "asc" } });
  }

  findBusinessTypeById(id: string): Promise<BusinessTypeRecord | null> {
    return this.prisma.businessType.findUnique({ where: { id } });
  }

  listActiveCities(): Promise<CityRecord[]> {
    return this.prisma.city.findMany({ where: { isActive: true }, orderBy: { name: "asc" } });
  }

  findCityById(id: string): Promise<CityRecord | null> {
    return this.prisma.city.findUnique({ where: { id } });
  }
}
