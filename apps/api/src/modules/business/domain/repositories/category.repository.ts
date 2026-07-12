export type CommerceModel = "PRODUCT" | "SERVICE";

export interface CategoryRecord {
  id: string;
  businessId: string;
  parentId: string | null;
  name: string;
  appliesTo: CommerceModel;
  sortOrder: number;
  isActive: boolean;
}

export interface CreateCategoryInput {
  parentId?: string;
  name: string;
  appliesTo: CommerceModel;
  sortOrder?: number;
}

/** Port — per-business catalog taxonomy, distinct from the platform-wide BusinessType list (Database Design §4.3). */
export interface CategoryRepository {
  listForBusiness(businessId: string): Promise<CategoryRecord[]>;
  findById(id: string): Promise<CategoryRecord | null>;
  create(businessId: string, input: CreateCategoryInput): Promise<CategoryRecord>;
  update(id: string, input: Partial<CreateCategoryInput> & { isActive?: boolean }): Promise<CategoryRecord>;
  delete(id: string): Promise<void>;
}

export const CATEGORY_REPOSITORY = Symbol("CATEGORY_REPOSITORY");
