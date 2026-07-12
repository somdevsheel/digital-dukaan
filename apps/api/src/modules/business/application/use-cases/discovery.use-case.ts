import { Inject, Injectable } from "@nestjs/common";
import { BUSINESS_REPOSITORY, type BusinessRecord, type BusinessRepository } from "../../domain/repositories/business.repository";
import { PRODUCT_REPOSITORY, type ProductRecord, type ProductRepository } from "../../domain/repositories/product.repository";
import { SERVICE_REPOSITORY, type ServiceRecord, type ServiceRepository } from "../../domain/repositories/service.repository";
import {
  BUSINESS_SEARCH_PORT,
  type BusinessSearchPort,
  type BusinessSearchQuery,
  type BusinessSearchResult,
} from "../../domain/services/business-search.port";
import { TAXONOMY_REPOSITORY, type BusinessTypeRecord, type CityRecord, type TaxonomyRepository } from "../../domain/repositories/taxonomy.repository";
import { BusinessNotFoundException } from "../../domain/errors/business.errors";
import type { SearchBusinessesDto } from "../dto/search-businesses.dto";

/** Public, unauthenticated read paths — PRD §8.1 discovery + business profile browsing. */
@Injectable()
export class DiscoveryUseCase {
  constructor(
    @Inject(BUSINESS_REPOSITORY) private readonly businesses: BusinessRepository,
    @Inject(PRODUCT_REPOSITORY) private readonly products: ProductRepository,
    @Inject(SERVICE_REPOSITORY) private readonly services: ServiceRepository,
    @Inject(TAXONOMY_REPOSITORY) private readonly taxonomy: TaxonomyRepository,
    @Inject(BUSINESS_SEARCH_PORT) private readonly searchPort: BusinessSearchPort,
  ) {}

  search(dto: SearchBusinessesDto): Promise<BusinessSearchResult> {
    const query: BusinessSearchQuery = {
      text: dto.q,
      businessTypeId: dto.businessTypeId,
      cityId: dto.cityId,
      pinCode: dto.pin,
      near:
        dto.lat !== undefined && dto.lng !== undefined
          ? { latitude: dto.lat, longitude: dto.lng, radiusMeters: dto.radiusM ?? 5000 }
          : undefined,
      filters: {
        minRating: dto["filter[rating]"],
        openNow: dto["filter[openNow]"],
        deliveryAvailable: dto["filter[deliveryAvailable]"],
        pickupAvailable: dto["filter[pickupAvailable]"],
        verifiedOnly: dto["filter[verified]"],
      },
      sort: dto.sort ?? (dto.lat !== undefined ? "distance" : "relevance"),
      cursor: dto.cursor,
      limit: dto.limit ?? 20,
    };
    return this.searchPort.search(query);
  }

  async getBySlug(slug: string): Promise<BusinessRecord> {
    const business = await this.businesses.findBySlug(slug);
    // A business pending/rejected verification is invisible to the public, regardless of
    // whether someone guesses its slug — verification gates discovery, not just search.
    if (!business || business.verificationStatus !== "VERIFIED") {
      throw new BusinessNotFoundException();
    }
    return business;
  }

  async listProducts(businessId: string, categoryId?: string): Promise<ProductRecord[]> {
    await this.assertVerified(businessId);
    return this.products.listForBusiness(businessId, { categoryId });
  }

  async listServices(businessId: string, categoryId?: string): Promise<ServiceRecord[]> {
    await this.assertVerified(businessId);
    return this.services.listForBusiness(businessId, categoryId);
  }

  listBusinessTypes(): Promise<BusinessTypeRecord[]> {
    return this.taxonomy.listBusinessTypes();
  }

  listCities(): Promise<CityRecord[]> {
    return this.taxonomy.listActiveCities();
  }

  private async assertVerified(businessId: string): Promise<void> {
    const business = await this.businesses.findById(businessId);
    if (!business || business.verificationStatus !== "VERIFIED") {
      throw new BusinessNotFoundException();
    }
  }
}
