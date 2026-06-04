import { scanAll, batchGetItems } from '../shared/db/dynamo-helpers';
import { TABLES } from '../shared/db/tables';

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
  async list(): Promise<SkillRecord[]> {
    const items = await scanAll(TABLES.skills);
    return items as SkillRecord[];
  }

  async getByIds(ids: string[]): Promise<SkillRecord[]> {
    const items = await batchGetItems(TABLES.skills, ids);
    return items as SkillRecord[];
  }
}
