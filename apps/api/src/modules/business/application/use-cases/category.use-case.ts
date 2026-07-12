import { Inject, Injectable } from "@nestjs/common";
import { CATEGORY_REPOSITORY, type CategoryRecord, type CategoryRepository } from "../../domain/repositories/category.repository";
import { ForbiddenException, NotFoundException } from "../../../../common/errors/app.errors";
import type { CreateCategoryDto, UpdateCategoryDto } from "../dto/category.dto";

@Injectable()
export class CategoryUseCase {
  constructor(@Inject(CATEGORY_REPOSITORY) private readonly categories: CategoryRepository) {}

  list(businessId: string): Promise<CategoryRecord[]> {
    return this.categories.listForBusiness(businessId);
  }

  create(businessId: string, dto: CreateCategoryDto): Promise<CategoryRecord> {
    return this.categories.create(businessId, dto);
  }

  async update(businessId: string, categoryId: string, dto: UpdateCategoryDto): Promise<CategoryRecord> {
    await this.assertOwned(businessId, categoryId);
    return this.categories.update(categoryId, dto);
  }

  async remove(businessId: string, categoryId: string): Promise<void> {
    await this.assertOwned(businessId, categoryId);
    await this.categories.delete(categoryId);
  }

  private async assertOwned(businessId: string, categoryId: string): Promise<CategoryRecord> {
    const category = await this.categories.findById(categoryId);
    if (!category) throw new NotFoundException("Category");
    // A category belonging to another business must 403, not silently succeed against the
    // wrong row — PermissionGuard already confirmed the caller manages *a* business, this
    // confirms it's *this* one (Database Design §6: cross-business category writes are an
    // application-layer invariant, not DB-enforced).
    if (category.businessId !== businessId) throw new ForbiddenException();
    return category;
  }
}
