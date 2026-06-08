import { AppError } from '../shared/errors/app-error';
import { ChildRepository, type ChildRecord } from '../repositories/child.repository';
import { InterestRepository } from '../repositories/interest.repository';
import { ParentRepository } from '../repositories/parent.repository';
import type { CreateChildDto, UpdateChildDto } from '../dtos/child.dto';

export class ChildService {
  constructor(
    private readonly childRepo: ChildRepository,
    private readonly interestRepo: InterestRepository,
    private readonly parentRepo: ParentRepository,
  ) {}

  private async enrich(child: ChildRecord) {
    const [interestCategories, interestSubCategories, parent] = await Promise.all([
      this.interestRepo.getCategoriesByIds(child.interestCategoryIds),
      this.interestRepo.getSubCategoriesByIds(child.interestSubCategoryIds),
      this.parentRepo.getById(child.parentId),
    ]);
    return { ...child, parent, interestCategories, interestSubCategories };
  }

  async create(dto: CreateChildDto) {
    return this.childRepo.create({
      parentId:               dto.parentId,
      nameOrNickName:         dto.nameOrNickName,
      dateOfBirth:            dto.dateOfBirth,
      skillIds:               dto.skillIds ?? [],
      interestCategoryIds:    dto.interestCategoryIds ?? [],
      interestSubCategoryIds: dto.interestSubCategoryIds ?? [],
    });
  }

  async getById(id: string) {
    const child = await this.childRepo.getById(id);
    if (!child) throw new AppError(404, 'Child not found');
    return this.enrich(child);
  }

  async update(id: string, dto: UpdateChildDto) {
    const child = await this.childRepo.getById(id);
    if (!child) throw new AppError(404, 'Child not found');
    await this.childRepo.update(id, dto);
    return this.getById(id);
  }

  async updateInterests(id: string, categoryIds: string[], subCategoryIds: string[]) {
    const child = await this.childRepo.getById(id);
    if (!child) throw new AppError(404, 'Child not found');
    await this.childRepo.updateInterests(id, categoryIds, subCategoryIds);
    return this.getById(id);
  }
}
