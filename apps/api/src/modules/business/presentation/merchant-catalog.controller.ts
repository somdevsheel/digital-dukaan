import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { RequirePermission } from "../../../common/decorators/require-permission.decorator";
import { CreateCategoryDto, UpdateCategoryDto } from "../application/dto/category.dto";
import { CreateProductDto, CreateVariantDto, UpdateProductDto, UpdateVariantDto } from "../application/dto/product.dto";
import { CreateServiceDto, UpdateServiceDto } from "../application/dto/service.dto";
import { RequestUploadUrlDto } from "../application/dto/upload-url.dto";
import { AddMediaAssetDto } from "../application/dto/product-image.dto";
import { CategoryUseCase } from "../application/use-cases/category.use-case";
import { ProductUseCase } from "../application/use-cases/product.use-case";
import { ServiceOfferingUseCase } from "../application/use-cases/service-offering.use-case";

@ApiTags("merchant/catalog")
@Controller("merchant/businesses/:businessId")
@RequirePermission("product.manage")
export class MerchantCatalogController {
  constructor(
    private readonly categories: CategoryUseCase,
    private readonly products: ProductUseCase,
    private readonly services: ServiceOfferingUseCase,
  ) {}

  // ---- Categories ----
  @Get("categories")
  listCategories(@Param("businessId") businessId: string) {
    return this.categories.list(businessId);
  }

  @Post("categories")
  createCategory(@Param("businessId") businessId: string, @Body() dto: CreateCategoryDto) {
    return this.categories.create(businessId, dto);
  }

  @Patch("categories/:categoryId")
  updateCategory(@Param("businessId") businessId: string, @Param("categoryId") categoryId: string, @Body() dto: UpdateCategoryDto) {
    return this.categories.update(businessId, categoryId, dto);
  }

  @Delete("categories/:categoryId")
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeCategory(@Param("businessId") businessId: string, @Param("categoryId") categoryId: string): Promise<void> {
    await this.categories.remove(businessId, categoryId);
  }

  // ---- Products ----
  @Get("products")
  listProducts(@Param("businessId") businessId: string, @Query("categoryId") categoryId?: string, @Query("cursor") cursor?: string) {
    return this.products.list(businessId, categoryId, cursor);
  }

  @Post("products")
  createProduct(@Param("businessId") businessId: string, @Body() dto: CreateProductDto) {
    return this.products.create(businessId, dto);
  }

  @Patch("products/:productId")
  updateProduct(@Param("businessId") businessId: string, @Param("productId") productId: string, @Body() dto: UpdateProductDto) {
    return this.products.update(businessId, productId, dto);
  }

  @Delete("products/:productId")
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeProduct(@Param("businessId") businessId: string, @Param("productId") productId: string): Promise<void> {
    await this.products.remove(businessId, productId);
  }

  @Post("products/:productId/variants")
  addVariant(@Param("businessId") businessId: string, @Param("productId") productId: string, @Body() dto: CreateVariantDto) {
    return this.products.addVariant(businessId, productId, dto);
  }

  @Patch("products/:productId/variants/:variantId")
  updateVariant(
    @Param("businessId") businessId: string,
    @Param("productId") productId: string,
    @Param("variantId") variantId: string,
    @Body() dto: UpdateVariantDto,
  ) {
    return this.products.updateVariant(businessId, productId, variantId, dto);
  }

  @Delete("products/:productId/variants/:variantId")
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeVariant(
    @Param("businessId") businessId: string,
    @Param("productId") productId: string,
    @Param("variantId") variantId: string,
  ): Promise<void> {
    await this.products.removeVariant(businessId, productId, variantId);
  }

  @Post("products/:productId/images/upload-url")
  createProductImageUploadUrl(
    @Param("businessId") businessId: string,
    @Param("productId") productId: string,
    @Body() dto: RequestUploadUrlDto,
  ) {
    return this.products.createImageUploadUrl(businessId, productId, dto.fileName, dto.contentType);
  }

  @Post("products/:productId/images")
  addProductImage(
    @Param("businessId") businessId: string,
    @Param("productId") productId: string,
    @Body() dto: AddMediaAssetDto,
  ) {
    return this.products.addImage(businessId, productId, dto.url, dto.sortOrder ?? 0);
  }

  @Delete("products/:productId/images/:imageId")
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeProductImage(
    @Param("businessId") businessId: string,
    @Param("productId") productId: string,
    @Param("imageId") imageId: string,
  ): Promise<void> {
    await this.products.removeImage(businessId, productId, imageId);
  }

  // ---- Services (Model B catalog) ----
  @Get("services")
  listServices(@Param("businessId") businessId: string, @Query("categoryId") categoryId?: string) {
    return this.services.list(businessId, categoryId);
  }

  @Post("services")
  createService(@Param("businessId") businessId: string, @Body() dto: CreateServiceDto) {
    return this.services.create(businessId, dto);
  }

  @Patch("services/:serviceId")
  updateService(@Param("businessId") businessId: string, @Param("serviceId") serviceId: string, @Body() dto: UpdateServiceDto) {
    return this.services.update(businessId, serviceId, dto);
  }

  @Delete("services/:serviceId")
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeService(@Param("businessId") businessId: string, @Param("serviceId") serviceId: string): Promise<void> {
    await this.services.remove(businessId, serviceId);
  }

  @Post("services/:serviceId/images/upload-url")
  createServiceImageUploadUrl(
    @Param("businessId") businessId: string,
    @Param("serviceId") serviceId: string,
    @Body() dto: RequestUploadUrlDto,
  ) {
    return this.services.createImageUploadUrl(businessId, serviceId, dto.fileName, dto.contentType);
  }

  @Post("services/:serviceId/images")
  addServiceImage(
    @Param("businessId") businessId: string,
    @Param("serviceId") serviceId: string,
    @Body() dto: AddMediaAssetDto,
  ) {
    return this.services.addImage(businessId, serviceId, dto.url, dto.sortOrder ?? 0);
  }

  @Delete("services/:serviceId/images/:imageId")
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeServiceImage(
    @Param("businessId") businessId: string,
    @Param("serviceId") serviceId: string,
    @Param("imageId") imageId: string,
  ): Promise<void> {
    await this.services.removeImage(businessId, serviceId, imageId);
  }
}
