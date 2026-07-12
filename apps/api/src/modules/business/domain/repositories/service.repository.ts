export interface ServiceImageRecord {
  id: string;
  url: string;
  sortOrder: number;
}

export interface ServiceRecord {
  id: string;
  businessId: string;
  categoryId: string | null;
  name: string;
  description: string | null;
  pricePaise: number;
  durationMinutes: number | null;
  isActive: boolean;
  images: ServiceImageRecord[];
}

export interface CreateServiceInput {
  categoryId?: string;
  name: string;
  description?: string;
  pricePaise: number;
  durationMinutes?: number;
}

export type UpdateServiceInput = Partial<CreateServiceInput> & { isActive?: boolean };

/** Port — Model B's catalog entity (PRD §6). No stock/variants: a service isn't inventory. */
export interface ServiceRepository {
  listForBusiness(businessId: string, categoryId?: string): Promise<ServiceRecord[]>;
  findById(id: string): Promise<ServiceRecord | null>;
  create(businessId: string, input: CreateServiceInput): Promise<ServiceRecord>;
  update(id: string, input: UpdateServiceInput): Promise<ServiceRecord>;
  delete(id: string): Promise<void>;
  addImage(serviceId: string, url: string, sortOrder: number): Promise<ServiceImageRecord>;
  removeImage(imageId: string): Promise<void>;
}

export const SERVICE_REPOSITORY = Symbol("SERVICE_REPOSITORY");
