import AppError from "../../shared/errors/AppError.js";
import type { ParentRepository } from "./repository.js";

export class ParentService {
  constructor(private parentRepository: ParentRepository) {}

  async getById(id: string) {
    const parent = await this.parentRepository.getById(id);
    if (!parent) throw new AppError(404, "Entity not found");
    return parent;
  }

  async updateSearchRadius(id: string, searchRadius: number) {
    const parent = await this.parentRepository.getById(id);
    if (!parent) throw new AppError(404, "Entity not found");

    return await this.parentRepository.updateSearchRadius(id, searchRadius);
  }

  async updateInterestPreferences(
    parentId: string,
    interestCategoryIds: string[],
    interestSubCategoryIds: string[],
  ) {
    const parent = await this.parentRepository.getById(parentId);
    if (!parent) throw new AppError(404, "Entity not found");

    const uniqueCategoryIds = [...new Set(interestCategoryIds)];
    const uniqueSubIds = [...new Set(interestSubCategoryIds)];

    const categoriesOk =
      await this.parentRepository.interestCategoriesExist(uniqueCategoryIds);
    if (!categoriesOk) {
      throw new AppError(
        400,
        "One or more interest category ids are invalid",
      );
    }

    const subRows =
      await this.parentRepository.findInterestSubCategoriesByIds(uniqueSubIds);
    if (subRows.length !== uniqueSubIds.length) {
      throw new AppError(
        400,
        "One or more interest subcategory ids are invalid",
      );
    }

    const categoryIdSet = new Set(uniqueCategoryIds);
    for (const row of subRows) {
      if (!categoryIdSet.has(row.categoryId)) {
        throw new AppError(
          400,
          "Each interest subcategory must belong to a selected interest category",
        );
      }
    }

    return this.parentRepository.updateInterestPreferences(
      parentId,
      uniqueCategoryIds,
      uniqueSubIds,
    );
  }
}
