export interface AddressRecord {
  id: string;
  userId: string;
  label: string;
  line1: string;
  line2: string | null;
  landmark: string | null;
  city: string;
  state: string;
  pinCode: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;
}

export interface UpsertAddressInput {
  label: string;
  line1: string;
  line2?: string;
  landmark?: string;
  city: string;
  state: string;
  pinCode: string;
  latitude: number;
  longitude: number;
  isDefault?: boolean;
}

/** Port — implemented by infrastructure/persistence/prisma-address.repository.ts. */
export interface AddressRepository {
  listForUser(userId: string): Promise<AddressRecord[]>;
  findById(id: string): Promise<AddressRecord | null>;
  create(userId: string, input: UpsertAddressInput): Promise<AddressRecord>;
  update(id: string, input: Partial<UpsertAddressInput>): Promise<AddressRecord>;
  softDelete(id: string): Promise<void>;
  clearDefaultForUser(userId: string): Promise<void>;
}

export const ADDRESS_REPOSITORY = Symbol("ADDRESS_REPOSITORY");
