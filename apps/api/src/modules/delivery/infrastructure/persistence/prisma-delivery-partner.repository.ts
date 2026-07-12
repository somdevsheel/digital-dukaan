import { Injectable } from "@nestjs/common";
import type { DeliveryPartner } from "@prisma/client";
import { PrismaService } from "../../../../common/prisma/prisma.service";
import type {
  DeliveryPartnerRecord,
  DeliveryPartnerRepository,
  RegisterDeliveryPartnerInput,
} from "../../domain/repositories/delivery-partner.repository";

@Injectable()
export class PrismaDeliveryPartnerRepository implements DeliveryPartnerRepository {
  constructor(private readonly prisma: PrismaService) {}

  async register(userId: string, input: RegisterDeliveryPartnerInput): Promise<DeliveryPartnerRecord> {
    const partner = await this.prisma.deliveryPartner.create({
      data: {
        userId,
        cityId: input.cityId,
        vehicleType: input.vehicleType,
        ...(input.vehicleNumber !== undefined ? { vehicleNumber: input.vehicleNumber } : {}),
      },
    });
    return this.toRecord(partner);
  }

  async findById(id: string): Promise<DeliveryPartnerRecord | null> {
    const partner = await this.prisma.deliveryPartner.findUnique({ where: { id } });
    return partner ? this.toRecord(partner) : null;
  }

  async findByUserId(userId: string): Promise<DeliveryPartnerRecord | null> {
    const partner = await this.prisma.deliveryPartner.findUnique({ where: { userId } });
    return partner ? this.toRecord(partner) : null;
  }

  async setAvailability(id: string, isAvailable: boolean): Promise<DeliveryPartnerRecord> {
    const partner = await this.prisma.deliveryPartner.update({ where: { id }, data: { isAvailable } });
    return this.toRecord(partner);
  }

  async updateLocation(id: string, latitude: number, longitude: number): Promise<void> {
    // The `geog` generated/trigger-synced column (Database Design §4.5) updates from these
    // two columns automatically — this repository never touches `geog` directly.
    await this.prisma.deliveryPartner.update({
      where: { id },
      data: { currentLatitude: latitude, currentLongitude: longitude },
    });
  }

  private toRecord(partner: DeliveryPartner): DeliveryPartnerRecord {
    return {
      id: partner.id,
      userId: partner.userId,
      cityId: partner.cityId,
      vehicleType: partner.vehicleType,
      vehicleNumber: partner.vehicleNumber,
      verificationStatus: partner.verificationStatus,
      isAvailable: partner.isAvailable,
      currentLatitude: partner.currentLatitude?.toNumber() ?? null,
      currentLongitude: partner.currentLongitude?.toNumber() ?? null,
      ratingAvg: partner.ratingAvg.toNumber(),
    };
  }
}
