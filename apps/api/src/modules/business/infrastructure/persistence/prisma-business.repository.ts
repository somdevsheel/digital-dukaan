import { Injectable } from "@nestjs/common";
import type { Business } from "@prisma/client";
import { PrismaService } from "../../../../common/prisma/prisma.service";
import type {
  BusinessListFilters,
  BusinessRecord,
  BusinessRepository,
  CreateBusinessInput,
  UpdateBusinessInput,
  VerificationStatus,
} from "../../domain/repositories/business.repository";

function whereFromFilters(filters: BusinessListFilters) {
  return {
    deletedAt: null,
    ...(filters.status !== undefined ? { verificationStatus: filters.status } : {}),
    ...(filters.cityId !== undefined ? { cityId: filters.cityId } : {}),
    ...(filters.businessTypeId !== undefined ? { businessTypeId: filters.businessTypeId } : {}),
  };
}

@Injectable()
export class PrismaBusinessRepository implements BusinessRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<BusinessRecord | null> {
    const business = await this.prisma.business.findUnique({ where: { id, deletedAt: null } });
    return business ? this.toRecord(business) : null;
  }

  async findBySlug(slug: string): Promise<BusinessRecord | null> {
    const business = await this.prisma.business.findFirst({ where: { slug, deletedAt: null } });
    return business ? this.toRecord(business) : null;
  }

  async slugExists(slug: string): Promise<boolean> {
    const count = await this.prisma.business.count({ where: { slug } });
    return count > 0;
  }

  async create(input: CreateBusinessInput): Promise<BusinessRecord> {
    const business = await this.prisma.business.create({
      data: {
        ownerUserId: input.ownerUserId,
        businessTypeId: input.businessTypeId,
        cityId: input.cityId,
        name: input.name,
        slug: input.slug,
        ...(input.description !== undefined ? { description: input.description } : {}),
        addressLine: input.addressLine,
        pinCode: input.pinCode,
        latitude: input.latitude,
        longitude: input.longitude,
        minOrderAmountPaise: input.minOrderAmountPaise ?? 0,
      },
    });
    return this.toRecord(business);
  }

  async update(id: string, input: UpdateBusinessInput): Promise<BusinessRecord> {
    const business = await this.prisma.business.update({ where: { id }, data: input });
    return this.toRecord(business);
  }

  async setVerificationStatus(id: string, status: VerificationStatus): Promise<BusinessRecord> {
    const business = await this.prisma.business.update({
      where: { id },
      data: { verificationStatus: status, verifiedAt: status === "VERIFIED" ? new Date() : null },
    });
    return this.toRecord(business);
  }

  async listByVerificationStatus(status: VerificationStatus, cursor?: string, limit = 20): Promise<BusinessRecord[]> {
    const businesses = await this.prisma.business.findMany({
      where: { verificationStatus: status, deletedAt: null },
      orderBy: { createdAt: "asc" },
      take: limit,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    return businesses.map((b) => this.toRecord(b));
  }

  async listAll(filters: BusinessListFilters, cursor?: string, limit = 20): Promise<BusinessRecord[]> {
    const businesses = await this.prisma.business.findMany({
      where: whereFromFilters(filters),
      orderBy: { createdAt: "desc" },
      take: limit,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    });
    return businesses.map((b) => this.toRecord(b));
  }

  count(filters: BusinessListFilters): Promise<number> {
    return this.prisma.business.count({ where: whereFromFilters(filters) });
  }

  private toRecord(business: Business): BusinessRecord {
    return {
      id: business.id,
      ownerUserId: business.ownerUserId,
      businessTypeId: business.businessTypeId,
      cityId: business.cityId,
      name: business.name,
      slug: business.slug,
      description: business.description,
      logoUrl: business.logoUrl,
      bannerUrl: business.bannerUrl,
      gstNumber: business.gstNumber,
      panNumber: business.panNumber,
      fssaiNumber: business.fssaiNumber,
      verificationStatus: business.verificationStatus,
      verifiedAt: business.verifiedAt,
      addressLine: business.addressLine,
      pinCode: business.pinCode,
      latitude: business.latitude.toNumber(),
      longitude: business.longitude.toNumber(),
      deliveryRadiusMeters: business.deliveryRadiusMeters,
      minOrderAmountPaise: business.minOrderAmountPaise,
      avgPrepTimeMinutes: business.avgPrepTimeMinutes,
      pickupEnabled: business.pickupEnabled,
      deliveryEnabled: business.deliveryEnabled,
      codEnabled: business.codEnabled,
      isOpen: business.isOpen,
      commissionRatePercent: business.commissionRatePercent.toNumber(),
      createdAt: business.createdAt,
    };
  }
}
