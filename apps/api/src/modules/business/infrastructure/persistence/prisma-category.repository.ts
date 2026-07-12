import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../../../common/prisma/prisma.service";
import type { CategoryRecord, CategoryRepository, CreateCategoryInput } from "../../domain/repositories/category.repository";

@Injectable()
export class PrismaCategoryRepository implements CategoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  listForBusiness(businessId: string): Promise<CategoryRecord[]> {
    return this.prisma.category.findMany({ where: { businessId }, orderBy: { sortOrder: "asc" } });
  }

  findById(id: string): Promise<CategoryRecord | null> {
    return this.prisma.category.findUnique({ where: { id } });
  }

  create(businessId: string, input: CreateCategoryInput): Promise<CategoryRecord> {
    return this.prisma.category.create({
      data: {
        businessId,
        ...(input.parentId !== undefined ? { parentId: input.parentId } : {}),
        name: input.name,
        appliesTo: input.appliesTo,
        sortOrder: input.sortOrder ?? 0,
      },
    });
  }

  update(id: string, input: Partial<CreateCategoryInput> & { isActive?: boolean }): Promise<CategoryRecord> {
    return this.prisma.category.update({ where: { id }, data: input });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.category.delete({ where: { id } });
  }
}
