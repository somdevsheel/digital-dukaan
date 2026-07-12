export interface ProductVariantRecord {
  id: string;
  name: string;
  sku: string | null;
  pricePaise: number;
  stockQuantity: number;
  lowStockThreshold: number;
  isActive: boolean;
}

export interface ProductImageRecord {
  id: string;
  url: string;
  sortOrder: number;
}

export interface ProductRecord {
  id: string;
  businessId: string;
  categoryId: string | null;
  name: string;
  slug: string;
  description: string | null;
  brand: string | null;
  basePricePaise: number;
  compareAtPricePaise: number | null;
  isActive: boolean;
  variants: ProductVariantRecord[];
  images: ProductImageRecord[];
}

export interface CreateVariantInput {
  name: string;
  sku?: string | undefined;
  pricePaise: number;
  stockQuantity?: number;
  lowStockThreshold?: number;
}

export interface CreateProductInput {
  categoryId?: string;
  name: string;
  slug: string;
  description?: string;
  brand?: string;
  basePricePaise: number;
  compareAtPricePaise?: number;
  variants: CreateVariantInput[]; // a product must have at least one variant to be sellable
}

export type UpdateProductInput = Partial<Omit<CreateProductInput, "slug" | "variants">>;

export interface VariantWithProductRecord extends ProductVariantRecord {
  productId: string;
  productName: string;
  businessId: string;
}

/**
 * Port — Product is the aggregate root over ProductVariant/ProductImage (Database Design
 * §3): neither has an independent lifecycle outside its parent product, so variant/image
 * mutation methods live on this repository rather than getting their own.
 */
export interface ProductRepository {
  listForBusiness(
    businessId: string,
    options?: { categoryId?: string | undefined; cursor?: string | undefined; limit?: number | undefined },
  ): Promise<ProductRecord[]>;
  findById(id: string): Promise<ProductRecord | null>;
  /** Used by Commerce's cart/checkout to resolve a variant without scanning the whole catalog. */
  findVariantById(variantId: string): Promise<VariantWithProductRecord | null>;
  slugExists(businessId: string, slug: string): Promise<boolean>;
  create(businessId: string, input: CreateProductInput): Promise<ProductRecord>;
  update(id: string, input: UpdateProductInput): Promise<ProductRecord>;
  delete(id: string): Promise<void>;

  addVariant(productId: string, input: CreateVariantInput): Promise<ProductVariantRecord>;
  updateVariant(variantId: string, input: Partial<CreateVariantInput> & { isActive?: boolean }): Promise<ProductVariantRecord>;
  removeVariant(variantId: string): Promise<void>;
  /** Atomic, transactional decrement guarding against oversell under concurrent checkout (Database Design §6). */
  decrementStock(variantId: string, quantity: number): Promise<boolean>;

  addImage(productId: string, url: string, sortOrder: number): Promise<ProductImageRecord>;
  removeImage(imageId: string): Promise<void>;
}

export const PRODUCT_REPOSITORY = Symbol("PRODUCT_REPOSITORY");
