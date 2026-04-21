import type { FacilitiesRepository } from "./repository.js";

type FacilityRow = Awaited<ReturnType<FacilitiesRepository["getAll"]>>[number];
type FacilityType = FacilityRow["type"];

const FACILITY_TYPE_ORDER: FacilityType[] = [
  "GENERAL",
  "PARENT",
  "KID",
  "DOG",
];

export type FacilityGroup = {
  type: FacilityType;
  facilities: Omit<FacilityRow, "type">[];
};

export class FacilitiesService {
  constructor(private facilitiesRepository: FacilitiesRepository) {}

  async getAll(): Promise<FacilityGroup[]> {
    const rows = await this.facilitiesRepository.getAll();
    const byType = new Map<FacilityType, Omit<FacilityRow, "type">[]>(
      FACILITY_TYPE_ORDER.map((t) => [t, []]),
    );

    for (const row of rows) {
      const { type, ...rest } = row;
      byType.get(type)!.push(rest);
    }

    return FACILITY_TYPE_ORDER.map((type) => ({
      type,
      facilities: byType.get(type)!,
    }));
  }
}
