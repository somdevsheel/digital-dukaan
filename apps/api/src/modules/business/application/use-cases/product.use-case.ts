import { randomUUID } from "node:crypto";
import { Inject, Injectable } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import {
  PRODUCT_REPOSITORY,
  type ProductImageRecord,
  type ProductRecord,
  type ProductRepository,
  type ProductVariantRecord,
} from "../../domain/repositories/product.repository";
import { STORAGE_PORT, type StoragePort } from "../../../../common/storage/storage.port";
import { ForbiddenException, NotFoundException } from "../../../../common/errors/app.errors";
import { SlugAlreadyTakenException } from "../../domain/errors/business.errors";
import type { CreateProductDto, UpdateProductDto, UpdateVariantDto } from "../dto/product.dto";

@Injectable()
export class ProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY) private readonly products: ProductRepository,
    @Inject(STORAGE_PORT) private readonly storage: StoragePort,
    private readonly events: EventEmitter2,
  ) {}

  list(businessId: string, categoryId?: string, cursor?: string, limit?: number): Promise<ProductRecord[]> {
    return this.products.listForBusiness(businessId, { categoryId, cursor, limit });
  }

  async create(businessId: string, dto: CreateProductDto): Promise<ProductRecord> {
    if (await this.products.slugExists(businessId, dto.slug)) {
      throw new SlugAlreadyTakenException();
    }
    const product = await this.products.create(businessId, dto);
    this.events.emit("product.upserted", { productId: product.id, businessId });
    return product;
  }

  async update(businessId: string, productId: string, dto: UpdateProductDto): Promise<ProductRecord> {
    await this.assertOwned(businessId, productId);
    const product = await this.products.update(productId, dto);
    this.events.emit("product.upserted", { productId: product.id, businessId });
    return product;
  }

  async remove(businessId: string, productId: string): Promise<void> {
    await this.assertOwned(businessId, productId);
    await this.products.delete(productId);
    this.events.emit("product.deleted", { productId, businessId });
  }

  async addVariant(businessId: string, productId: string, dto: CreateProductDto["variants"][number]): Promise<ProductVariantRecord> {
    await this.assertOwned(businessId, productId);
    const variant = await this.products.addVariant(productId, dto);
    this.events.emit("product.upserted", { productId, businessId });
    return variant;
  }

  async updateVariant(businessId: string, productId: string, variantId: string, dto: UpdateVariantDto): Promise<ProductVariantRecord> {
    await this.assertOwned(businessId, productId);
    const variant = await this.products.updateVariant(variantId, dto);
    this.events.emit("product.upserted", { productId, businessId });
    return variant;
  }

  async removeVariant(businessId: string, productId: string, variantId: string): Promise<void> {
    await this.assertOwned(businessId, productId);
    await this.products.removeVariant(variantId);
    this.events.emit("product.upserted", { productId, businessId });
  }

  async createImageUploadUrl(businessId: string, productId: string, fileName: string, contentType: string) {
    await this.assertOwned(businessId, productId);
    const key = `businesses/${businessId}/products/${productId}/${randomUUID()}-${fileName}`;
    return this.storage.getPresignedUploadUrl(key, contentType);
  }

  async addImage(businessId: string, productId: string, url: string, sortOrder: number): Promise<ProductImageRecord> {
    await this.assertOwned(businessId, productId);
    return this.products.addImage(productId, url, sortOrder);
  }

  async removeImage(businessId: string, productId: string, imageId: string): Promise<void> {
    await this.assertOwned(businessId, productId);
    await this.products.removeImage(imageId);
  }

  private async assertOwned(businessId: string, productId: string): Promise<ProductRecord> {
    const product = await this.products.findById(productId);
    if (!product) throw new NotFoundException("Product");
    if (product.businessId !== businessId) throw new ForbiddenException();
    return product;
  }
}
