/**
 * General facilities on **OpportunityEvent**: API sends slugs; Prisma stores M2M to `opportunity_general_facilities`.
 * Venues, clubs, and routes still use `opportunity_general_facilities` with join tables.
 */
export const OPPORTUNITY_EVENT_GENERAL_FACILITY_LABELS = {
  baby_changing: "Baby changing",
  benches: "Bench Seating",
  disabled_toilets: "Disabled toilets",
  indoor_seating: "Indoor Seating",
  outdoor_seating: "Outdoor Seating",
  picnic_benches: "Picnic Benches",
  showers_changing: "Showers / changing facilities",
  toilets: "Toilets",
} as const;

export type OpportunityEventGeneralFacilitySlug =
  keyof typeof OPPORTUNITY_EVENT_GENERAL_FACILITY_LABELS;

export const OPPORTUNITY_EVENT_GENERAL_FACILITY_SLUGS = Object.keys(
  OPPORTUNITY_EVENT_GENERAL_FACILITY_LABELS,
) as OpportunityEventGeneralFacilitySlug[];

export function opportunityEventGeneralFacilityLabel(slug: string): string {
  return (
    OPPORTUNITY_EVENT_GENERAL_FACILITY_LABELS[
      slug as OpportunityEventGeneralFacilitySlug
    ] ?? slug
  );
}
