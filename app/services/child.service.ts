import { AppError } from '../shared/errors/app-error';
import { ChildRepository } from '../repositories/child.repository';
import type { CreateChildDto, UpdateChildDto } from '../dtos/child.dto';

export class ChildService {
  constructor(private readonly childRepo: ChildRepository) {}

  async create(dto: CreateChildDto) {
    const record = await this.childRepo.create({
      parentId:               dto.parentId,
      nameOrNickName:         dto.nameOrNickName,
      dateOfBirth:            dto.dateOfBirth,
      skillIds:               dto.skillIds ?? [],
      interestCategoryIds:    dto.interestCategoryIds ?? [],
      interestSubCategoryIds: dto.interestSubCategoryIds ?? [],
    });
    return record;
  }

  async getById(id: string) {
    const child = await this.childRepo.getById(id);
    if (!child) throw new AppError(404, 'Child not found');
    return child;
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
