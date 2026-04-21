import AppError from "../../shared/errors/AppError.js";
import type { ParentRepository } from "../parents/repository.js";
import type { RequestChildrenCreateDto } from "./dto.js";
import { StatusCodes } from "http-status-codes";
import type { ChildrenRepository } from "./repository.js";

export class ChildrenService {
  constructor(
    private parentRepository: ParentRepository,
    private childrenRepository: ChildrenRepository,
  ) {}

  async getById(id: string) {
    const entity = await this.childrenRepository.getById(id);
    if (!entity) throw new AppError(404, "Child not found");

    return entity;
  }

  async create(data: RequestChildrenCreateDto): Promise<string[]> {
    const entity = await this.parentRepository.getById(data.parentId);
    if (!entity) throw new AppError(StatusCodes.NOT_FOUND, "Parent not found.");

    return await this.childrenRepository.create(data);
  }

  async updateInterestPreferences(
    childId: string,
    interestCategoryIds: string[],
    interestSubCategoryIds: string[],
  ) {
    const child = await this.childrenRepository.getById(childId);
    if (!child) throw new AppError(404, "Child not found");

    const uniqueCategoryIds = [...new Set(interestCategoryIds)];
    const uniqueSubIds = [...new Set(interestSubCategoryIds)];

    const categoriesOk =
      await this.childrenRepository.interestCategoriesExist(uniqueCategoryIds);
    if (!categoriesOk) {
      throw new AppError(
        400,
        "One or more interest category ids are invalid",
      );
    }

    const subRows =
      await this.childrenRepository.findInterestSubCategoriesByIds(uniqueSubIds);
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

    return this.childrenRepository.updateInterestPreferences(
      childId,
      uniqueCategoryIds,
      uniqueSubIds,
    );
  }
}
