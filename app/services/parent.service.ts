import { AppError } from '../shared/errors/app-error';
import { ParentRepository } from '../repositories/parent.repository';
import { InterestRepository } from '../repositories/interest.repository';
import { ChildRepository } from '../repositories/child.repository';

export class ParentService {
  constructor(
    private readonly parentRepo: ParentRepository,
    private readonly interestRepo: InterestRepository,
    private readonly childRepo: ChildRepository,
  ) {}

  async getById(id: string) {
    const parent = await this.parentRepo.getById(id);
    if (!parent) throw new AppError(404, 'Parent not found');

    const [categories, subCategories,  children] = await Promise.all([
      this.interestRepo.getCategoriesBySlugs(parent.interestCategoryIds),
      this.interestRepo.getSubCategoriesBySlugs(parent.interestSubCategoryIds),
      this.childRepo.listByParentId(parent.id),
    ]);

    return { ...parent, interestCategories: categories, interestSubCategories: subCategories, children };
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

    const valid = await this.parentRepo.interestCategorySlugsExist(categoryIds);
    if (!valid) throw new AppError(400, 'One or more interest category slugs are invalid');

    await this.parentRepo.updateInterests(id, categoryIds, subCategoryIds);
    return this.getById(id);
  }
}
