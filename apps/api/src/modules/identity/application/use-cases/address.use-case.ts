import { Inject, Injectable } from "@nestjs/common";
import {
  ADDRESS_REPOSITORY,
  type AddressRecord,
  type AddressRepository,
} from "../../domain/repositories/address.repository";
import { ForbiddenException, NotFoundException } from "../../../../common/errors/app.errors";
import type { CreateAddressDto, UpdateAddressDto } from "../dto/upsert-address.dto";

@Injectable()
export class AddressUseCase {
  constructor(@Inject(ADDRESS_REPOSITORY) private readonly addresses: AddressRepository) {}

  list(userId: string): Promise<AddressRecord[]> {
    return this.addresses.listForUser(userId);
  }

  async create(userId: string, dto: CreateAddressDto): Promise<AddressRecord> {
    if (dto.isDefault) {
      await this.addresses.clearDefaultForUser(userId);
    }
    return this.addresses.create(userId, dto);
  }

  async update(userId: string, addressId: string, dto: UpdateAddressDto): Promise<AddressRecord> {
    const existing = await this.findOwned(userId, addressId);
    if (dto.isDefault) {
      await this.addresses.clearDefaultForUser(userId);
    }
    return this.addresses.update(existing.id, dto);
  }

  async remove(userId: string, addressId: string): Promise<void> {
    const existing = await this.findOwned(userId, addressId);
    await this.addresses.softDelete(existing.id);
  }

  private async findOwned(userId: string, addressId: string): Promise<AddressRecord> {
    const address = await this.addresses.findById(addressId);
    if (!address) {
      throw new NotFoundException("Address");
    }
    if (address.userId !== userId) {
      throw new ForbiddenException();
    }
    return address;
  }
}
