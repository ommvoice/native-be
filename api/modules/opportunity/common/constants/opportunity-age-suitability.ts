/**
 * Age suitabilities on **OpportunityEvent**: API sends slugs; Prisma stores M2M to `opportunity_age_suitabilities`.
 * Venues and clubs still use `opportunity_age_suitabilities` with join tables.
 */
export const OPPORTUNITY_EVENT_AGE_SUITABILITY_LABELS = {
  under_1: "Under 1's",
  age_1: "1",
  age_2: "2",
  age_3: "3",
  age_4: "4",
  age_5: "5",
  age_6: "6",
  age_7: "7",
  age_8: "8",
  age_9: "9",
  age_10: "10",
  age_11: "11",
  age_12: "12",
  age_13_plus: "13+",
  age_16_plus: "16+",
} as const;

export type OpportunityEventAgeSuitabilitySlug =
  keyof typeof OPPORTUNITY_EVENT_AGE_SUITABILITY_LABELS;

export const OPPORTUNITY_EVENT_AGE_SUITABILITY_SLUGS = Object.keys(
  OPPORTUNITY_EVENT_AGE_SUITABILITY_LABELS,
) as OpportunityEventAgeSuitabilitySlug[];

export function opportunityEventAgeSuitabilityLabel(slug: string): string {
  return (
    OPPORTUNITY_EVENT_AGE_SUITABILITY_LABELS[
      slug as OpportunityEventAgeSuitabilitySlug
    ] ?? slug
  );
}
