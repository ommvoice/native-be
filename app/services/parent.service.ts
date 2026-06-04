import { AppError } from '../shared/errors/app-error';
import { ParentRepository } from '../repositories/parent.repository';
import { InterestRepository } from '../repositories/interest.repository';

export class ParentService {
  constructor(
    private readonly parentRepo: ParentRepository,
    private readonly interestRepo: InterestRepository,
  ) {}

  async getById(id: string) {
    const parent = await this.parentRepo.getById(id);
    if (!parent) throw new AppError(404, 'Parent not found');

    const [categories, subCategories] = await Promise.all([
      this.interestRepo.getCategoriesByIds(parent.interestCategoryIds),
      this.interestRepo.getSubCategoriesByIds(parent.interestSubCategoryIds),
    ]);

    return { ...parent, interestCategories: categories, interestSubCategories: subCategories };
  }

  async updateSearchRadius(id: string, searchRadius: number) {
    const parent = await this.parentRepo.getById(id);
    if (!parent) throw new AppError(404, 'Parent not found');
    await this.parentRepo.updateSearchRadius(id, searchRadius);
    return this.getById(id);
  }

  async updateInterests(id: string, categoryIds: string[], subCategoryIds: string[]) {
    const parent = await this.parentRepo.getById(id);
    if (!parent) throw new AppError(404, 'Parent not found');

    const valid = await this.parentRepo.interestCategoryIdsExist(categoryIds);
    if (!valid) throw new AppError(400, 'One or more interest category IDs are invalid');

    await this.parentRepo.updateInterests(id, categoryIds, subCategoryIds);
    return this.getById(id);
  }
}
