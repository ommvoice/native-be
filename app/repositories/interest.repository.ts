import { AssetsService } from '../services/assets.service';

export interface InterestTagRecord {
  id: string;
  slug: string;
  name: string;
}

export interface InterestCategoryRecord {
  id: string;
  slug: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface InterestSubCategoryRecord {
  id: string;
  slug: string;
  name: string;
  interestId: string;
  parentId: string | null;
  suitableForAge: string | null;
  createdAt: string;
  updatedAt: string;
}

export class InterestRepository {
  private readonly assets = new AssetsService();

  async listCategories(): Promise<InterestCategoryRecord[]> {
    return this.assets.getInterestCategories();
  }

  async listSubCategories(categorySlug?: string): Promise<InterestSubCategoryRecord[]> {
    return this.assets.getInterestSubCategories(categorySlug);
  }

  async getCategoriesBySlugs(slugs: string[]): Promise<InterestCategoryRecord[]> {
    const set = new Set(slugs);
    return this.assets.getInterestCategories().filter((c) => set.has(c.slug));
  }

  async getSubCategoriesBySlugs(slugs: string[]): Promise<InterestSubCategoryRecord[]> {
    const set = new Set(slugs);
    return this.assets.getInterestSubCategories().filter((s) => set.has(s.slug));
  }

  async listInterestTags(): Promise<InterestTagRecord[]> {
    const items = this.assets.getIntrestTags()
    return items as InterestTagRecord[];
  }
}
