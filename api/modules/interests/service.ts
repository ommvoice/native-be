import type { InterestRepository } from "./repository.js";
import type { InterestCategoryResponse } from "./types.js";

export class InterestService {
  constructor(private interestRepository: InterestRepository) {}

  async getAll(): Promise<InterestCategoryResponse[]> {
    return this.interestRepository.getAll();
  }
}
