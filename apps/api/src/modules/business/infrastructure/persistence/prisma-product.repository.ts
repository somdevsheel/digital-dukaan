import { Injectable } from "@nestjs/common";
import type { Product, ProductImage, ProductVariant } from "@prisma/client";
import { PrismaService } from "../../../../common/prisma/prisma.service";
import type {
  CreateProductInput,
  CreateVariantInput,
  ProductImageRecord,
  ProductRecord,
  ProductRepository,
  ProductVariantRecord,
  UpdateProductInput,
  VariantWithProductRecord,
} from "../../domain/repositories/product.repository";

type ProductWithRelations = Product & { variants: ProductVariant[]; images: ProductImage[] };

const INCLUDE = { variants: true, images: { orderBy: { sortOrder: "asc" as const } } };

@Injectable()
export class PrismaProductRepository implements ProductRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listForBusiness(
    businessId: string,
    options?: { categoryId?: string | undefined; cursor?: string | undefined; limit?: number | undefined },
  ): Promise<ProductRecord[]> {
    const products = await this.prisma.product.findMany({
      where: { businessId, deletedAt: null, isActive: true, ...(options?.categoryId ? { categoryId: options.categoryId } : {}) },
      orderBy: { createdAt: "desc" },
      take: options?.limit ?? 20,
      ...(options?.cursor ? { cursor: { id: options.cursor }, skip: 1 } : {}),
      include: INCLUDE,
    });
    return products.map((p) => this.toRecord(p));
  }

  async findById(id: string): Promise<ProductRecord | null> {
    const product = await this.prisma.product.findUnique({ where: { id, deletedAt: null }, include: INCLUDE });
    return product ? this.toRecord(product) : null;
  }

  async findVariantById(variantId: string): Promise<VariantWithProductRecord | null> {
    const variant = await this.prisma.productVariant.findUnique({
      where: { id: variantId },
      include: { product: { select: { id: true, name: true, businessId: true, deletedAt: true, isActive: true } } },
    });
    if (!variant || variant.product.deletedAt || !variant.product.isActive) return null;
    return {
      id: variant.id,
      name: variant.name,
      sku: variant.sku,
      pricePaise: variant.pricePaise,
      stockQuantity: variant.stockQuantity,
      lowStockThreshold: variant.lowStockThreshold,
      isActive: variant.isActive,
      productId: variant.product.id,
      productName: variant.product.name,
      businessId: variant.product.businessId,
    };
  }

  async slugExists(businessId: string, slug: string): Promise<boolean> {
    const count = await this.prisma.product.count({ where: { businessId, slug } });
    return count > 0;
  }

  async create(businessId: string, input: CreateProductInput): Promise<ProductRecord> {
    const product = await this.prisma.product.create({
      data: {
        businessId,
        ...(input.categoryId !== undefined ? { categoryId: input.categoryId } : {}),
        name: input.name,
        slug: input.slug,
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.brand !== undefined ? { brand: input.brand } : {}),
        basePricePaise: input.basePricePaise,
        ...(input.compareAtPricePaise !== undefined ? { compareAtPricePaise: input.compareAtPricePaise } : {}),
        variants: { create: input.variants.map((v) => this.variantWriteData(v)) },
      },
      include: INCLUDE,
    });
    return this.toRecord(product);
  }

  async update(id: string, input: UpdateProductInput): Promise<ProductRecord> {
    const product = await this.prisma.product.update({ where: { id }, data: input, include: INCLUDE });
    return this.toRecord(product);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.product.update({ where: { id }, data: { deletedAt: new Date(), isActive: false } });
  }

  async addVariant(productId: string, input: CreateVariantInput): Promise<ProductVariantRecord> {
    return this.prisma.productVariant.create({ data: { productId, ...this.variantWriteData(input) } });
  }

  async updateVariant(variantId: string, input: Partial<CreateVariantInput> & { isActive?: boolean }): Promise<ProductVariantRecord> {
    const { sku, ...rest } = input;
    return this.prisma.productVariant.update({
      where: { id: variantId },
      data: { ...rest, ...(sku !== undefined ? { sku } : {}) },
    });
  }

  async removeVariant(variantId: string): Promise<void> {
    await this.prisma.productVariant.delete({ where: { id: variantId } });
  }

  async decrementStock(variantId: string, quantity: number): Promise<boolean> {
    // A conditional UPDATE ... WHERE stock_quantity >= quantity, not a read-then-write —
    // this is what actually prevents oversell under concurrent checkout (Database Design
    // §6). `updateMany` returns a rowcount; zero rows affected means the guard failed.
    const result = await this.prisma.productVariant.updateMany({
      where: { id: variantId, stockQuantity: { gte: quantity } },
      data: { stockQuantity: { decrement: quantity } },
    });
    return result.count > 0;
  }

  async addImage(productId: string, url: string, sortOrder: number): Promise<ProductImageRecord> {
    return this.prisma.productImage.create({ data: { productId, url, sortOrder } });
  }

  async removeImage(imageId: string): Promise<void> {
    await this.prisma.productImage.delete({ where: { id: imageId } });
  }

  private variantWriteData(input: CreateVariantInput) {
    return {
      name: input.name,
      ...(input.sku !== undefined ? { sku: input.sku } : {}),
      pricePaise: input.pricePaise,
      stockQuantity: input.stockQuantity ?? 0,
      lowStockThreshold: input.lowStockThreshold ?? 5,
    };
  }

  private toRecord(product: ProductWithRelations): ProductRecord {
    return {
      id: product.id,
      businessId: product.businessId,
      categoryId: product.categoryId,
      name: product.name,
      slug: product.slug,
      description: product.description,
      brand: product.brand,
      basePricePaise: product.basePricePaise,
      compareAtPricePaise: product.compareAtPricePaise,
      isActive: product.isActive,
      variants: product.variants,
      images: product.images,
    };
  }
}
