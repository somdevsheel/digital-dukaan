import { Injectable } from "@nestjs/common";
import type { Address } from "@prisma/client";
import { PrismaService } from "../../../../common/prisma/prisma.service";
import type {
  AddressRecord,
  AddressRepository,
  UpsertAddressInput,
} from "../../domain/repositories/address.repository";

@Injectable()
export class PrismaAddressRepository implements AddressRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listForUser(userId: string): Promise<AddressRecord[]> {
    const addresses = await this.prisma.address.findMany({
      where: { userId, deletedAt: null },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });
    return addresses.map((address) => this.toRecord(address));
  }

  async findById(id: string): Promise<AddressRecord | null> {
    const address = await this.prisma.address.findUnique({ where: { id } });
    if (!address || address.deletedAt) return null;
    return this.toRecord(address);
  }

  async create(userId: string, input: UpsertAddressInput): Promise<AddressRecord> {
    // Prisma accepts a plain `number` for a Decimal column on writes — the conversion
    // back to `number` in toRecord() below is the only direction that needs help.
    const address = await this.prisma.address.create({
      data: { ...input, userId, isDefault: input.isDefault ?? false },
    });
    return this.toRecord(address);
  }

  async update(id: string, input: Partial<UpsertAddressInput>): Promise<AddressRecord> {
    const address = await this.prisma.address.update({ where: { id }, data: input });
    return this.toRecord(address);
  }

  async softDelete(id: string): Promise<void> {
    await this.prisma.address.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async clearDefaultForUser(userId: string): Promise<void> {
    await this.prisma.address.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });
  }

  // Prisma's `Decimal` (decimal.js) is the correct column type for lat/lng precision,
  // but the domain layer works in plain `number` — this is the one place that conversion
  // happens, so no repository caller has to think about it.
  private toRecord(address: Address): AddressRecord {
    return {
      id: address.id,
      userId: address.userId,
      label: address.label,
      line1: address.line1,
      line2: address.line2,
      landmark: address.landmark,
      city: address.city,
      state: address.state,
      pinCode: address.pinCode,
      latitude: address.latitude.toNumber(),
      longitude: address.longitude.toNumber(),
      isDefault: address.isDefault,
    };
  }
}
