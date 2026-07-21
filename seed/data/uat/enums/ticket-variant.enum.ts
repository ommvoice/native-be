export interface TicketVariantEntry {
  name: string;
  slug: string;
  relatedEnumNameSlugs?: string[];
  active: boolean;
}

export const TICKET_VARIANT_ENUM: TicketVariantEntry[] = [
  { name: "Baby", slug: "baby", active: true },
  { name: "(Fixed) Child", slug: "fixed_child", active: true },
  { name: "Young Child", slug: "young_child", active: true },
  { name: "Older Child", slug: "older_child", active: true },
  { name: "Adult", slug: "adult", active: true },
  { name: "Concession", slug: "concession", active: true },
  { name: "Group", slug: "group", active: true },
  { name: "Advance Book", slug: "advance_book", active: true },
];

export type TicketVariantSlug = (typeof TICKET_VARIANT_ENUM)[number]["slug"];
