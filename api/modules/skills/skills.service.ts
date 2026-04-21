import type { SkillRepository } from "./skills.repository.js";

export class SkillService {
  constructor(private skillRepository: SkillRepository) {}

  async getInterestBased() {
    return this.skillRepository.getInterestBased();
  }

  async getAgeBased() {
    return this.skillRepository.getAgeBased();
  }

  async getAll() {
    return this.skillRepository.getAll();
  }

  async getLevels() {
    return this.skillRepository.getLevels();
  }
}
