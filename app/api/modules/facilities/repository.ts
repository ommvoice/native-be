import { scanAll } from "../../database/dynamo-helpers.js";
import { TABLES } from "../../database/tables.js";
import type { Facility } from "../../types/db.js";

function fromDbFacility(item: Record<string, unknown>): Facility {
  return {
    id: item.id as string,
    type: item.type as Facility["type"],
    slug: item.slug as string,
    label: item.label as string,
    createdAt: new Date(item.createdAt as string),
    updatedAt: new Date(item.updatedAt as string),
  };
}

export class FacilitiesRepository {
  async getAll(): Promise<Facility[]> {
    const items = await scanAll(TABLES.facilities);
    return items
      .map((i) => fromDbFacility(i))
      .sort((a, b) => {
        const typeCmp = a.type.localeCompare(b.type);
        return typeCmp !== 0 ? typeCmp : a.slug.localeCompare(b.slug);
      });
  }

  async findBySlug(slug: string): Promise<Facility | null> {
    const items = await scanAll(TABLES.facilities);
    const found = items.find((i) => i.slug === slug);
    return found ? fromDbFacility(found) : null;
  }
}
