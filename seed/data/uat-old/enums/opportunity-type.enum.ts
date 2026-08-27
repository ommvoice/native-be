export interface OpportunityTypeEntry {
  name: string;
  slug: string;
  active: boolean;
}

export const OPPORTUNITY_TYPE_ENUM: OpportunityTypeEntry[] = [
  { name: "Activity Venue", slug: "venue", active: true },
  { name: "Route", slug: "route", active: true },
  { name: "Club", slug: "club", active: true },
  { name: "Event", slug: "event", active: true },
  { name: "Experience", slug: "experience", active: false },
  { name: "Community", slug: "community", active: false },
  { name: "Support", slug: "support", active: false },
];

export type OpportunityTypeSlug = (typeof OPPORTUNITY_TYPE_ENUM)[number]["slug"];
