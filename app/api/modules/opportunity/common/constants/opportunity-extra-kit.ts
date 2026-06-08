/**
 * Extra kits on **OpportunityEvent**: API sends slugs; Prisma stores M2M to `opportunity_extra_kits`.
 * Venues, clubs, and routes still use `opportunity_extra_kits` with join tables.
 */
export const OPPORTUNITY_EVENT_EXTRA_KIT_LABELS = {
  camping_gear: "Camping Gear",
  headtorch: "Headtorch",
  pram_buggy_road: "Pram / buggy (road surfaces)",
  sling_baby_carrier: "Sling / baby carrier",
  sturdy_footwear: "Sturdy footwear",
  wellies: "Wellies",
  xc_buggy: "XC Buggy",
} as const;

export type OpportunityEventExtraKitSlug =
  keyof typeof OPPORTUNITY_EVENT_EXTRA_KIT_LABELS;

export const OPPORTUNITY_EVENT_EXTRA_KIT_SLUGS = Object.keys(
  OPPORTUNITY_EVENT_EXTRA_KIT_LABELS,
) as OpportunityEventExtraKitSlug[];

export function opportunityEventExtraKitLabel(slug: string): string {
  return (
    OPPORTUNITY_EVENT_EXTRA_KIT_LABELS[
      slug as OpportunityEventExtraKitSlug
    ] ?? slug
  );
}
