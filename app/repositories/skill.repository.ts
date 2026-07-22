import { AssetsService } from '../services/assets.service';

export interface SkillRecord {
  id: string;
  slug: string;
  label: string;
  description: string;
  type: 'INTEREST_BASED' | 'AGE_BASED';
  subCategoryId: string | null;
  minAge: number | null;
  maxAge: number | null;
  createdAt: string;
  updatedAt: string;
}

export class SkillRepository {
  private readonly assets = new AssetsService();

  async list(): Promise<SkillRecord[]> {
    return this.assets.getSkills();
  }
}
