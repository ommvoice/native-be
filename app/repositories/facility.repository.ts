import { AssetsService } from '../services/assets.service';

export interface FacilityRecord {
  id: string;
  slug: string;
  label: string;
  type: 'GENERAL' | 'PARENT' | 'KID' | 'DOG';
  createdAt: string;
  updatedAt: string;
}

export class FacilityRepository {
  private readonly assets = new AssetsService();

  async list(): Promise<FacilityRecord[]> {
    return this.assets.getFacilities();
  }

  async getBySlug(slug: string): Promise<FacilityRecord | null> {
    return this.assets.getFacilityBySlug(slug);
  }
}
