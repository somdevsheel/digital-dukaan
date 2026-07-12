import { Inject, Injectable } from "@nestjs/common";
import {
  DELIVERY_PARTNER_REPOSITORY,
  type DeliveryPartnerRecord,
  type DeliveryPartnerRepository,
} from "../../domain/repositories/delivery-partner.repository";
import { DeliveryPartnerNotFoundException } from "../../domain/errors/delivery.errors";
import type { RegisterDeliveryPartnerDto } from "../dto/delivery-partner.dto";

@Injectable()
export class DeliveryPartnerUseCase {
  constructor(@Inject(DELIVERY_PARTNER_REPOSITORY) private readonly partners: DeliveryPartnerRepository) {}

  register(userId: string, dto: RegisterDeliveryPartnerDto): Promise<DeliveryPartnerRecord> {
    return this.partners.register(userId, dto);
  }

  async getMine(userId: string): Promise<DeliveryPartnerRecord> {
    const partner = await this.partners.findByUserId(userId);
    if (!partner) throw new DeliveryPartnerNotFoundException();
    return partner;
  }

  async setAvailability(userId: string, isAvailable: boolean): Promise<DeliveryPartnerRecord> {
    const partner = await this.getMine(userId);
    return this.partners.setAvailability(partner.id, isAvailable);
  }

  async updateLocation(userId: string, latitude: number, longitude: number): Promise<void> {
    const partner = await this.getMine(userId);
    await this.partners.updateLocation(partner.id, latitude, longitude);
  }
}
