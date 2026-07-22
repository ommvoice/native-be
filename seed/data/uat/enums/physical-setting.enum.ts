export interface PhysicalSettingEntry {
  name: string;
  slug: string;
  active: boolean;
}

export const PHYSICAL_SETTING_ENUM: PhysicalSettingEntry[] = [
  { name: "Inside", slug: "inside", active: true },
  { name: "Outside", slug: "outside", active: true },
  { name: "Mixed", slug: "mixed_covering", active: true },
];

export type PhysicalSettingSlug = (typeof PHYSICAL_SETTING_ENUM)[number]["slug"];
