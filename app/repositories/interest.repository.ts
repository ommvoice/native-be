import { scanAll, batchGetItems } from '../shared/db/dynamo-helpers';
import { TABLES } from '../shared/db/tables';

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
  async listCategories(): Promise<InterestCategoryRecord[]> {
    const items = await scanAll(TABLES.interestCategories);
    return items as InterestCategoryRecord[];
  }

  async listSubCategories(categoryId?: string): Promise<InterestSubCategoryRecord[]> {
    const items = await scanAll(TABLES.opportunityThemes);
    const all = items as InterestSubCategoryRecord[];
    return categoryId ? all.filter((i) => i.interestId === categoryId) : all;
  }

  async getCategoriesByIds(ids: string[]): Promise<InterestCategoryRecord[]> {
    const items = await batchGetItems(TABLES.interestCategories, ids);
    return items as InterestCategoryRecord[];
  }

  async getSubCategoriesByIds(ids: string[]): Promise<InterestSubCategoryRecord[]> {
    const items = await batchGetItems(TABLES.opportunityThemes, ids);
    return items as InterestSubCategoryRecord[];
  }

  async listInterestTags(): Promise<InterestTagRecord[]> {
    const items = [{
      id: '1',
      slug: 'dogs',
      name: 'Dogs'
    }, {
      id: '2',
      slug: 'cats',
      name: 'Cats'
    }, {
      id: '3',
      slug: 'birds',
      name: 'Birds'
    }];
    return items as InterestTagRecord[];
  }
}
