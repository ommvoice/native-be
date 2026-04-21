/**
 * Parking provisions allowed on **OpportunityEvent** only: stored as `parkingProvisionSlug` (no FK).
 * Venues, clubs, and routes still use `opportunity_parking_provisions`.
 */
export const OPPORTUNITY_EVENT_PARKING_PROVISION_LABELS = {
  free_car_park: "Free Car Park",
  paid_car_park: "Paid Car Park",
} as const;

export type OpportunityEventParkingProvisionSlug =
  keyof typeof OPPORTUNITY_EVENT_PARKING_PROVISION_LABELS;

export const OPPORTUNITY_EVENT_PARKING_PROVISION_SLUGS = Object.keys(
  OPPORTUNITY_EVENT_PARKING_PROVISION_LABELS,
) as OpportunityEventParkingProvisionSlug[];

export function opportunityEventParkingProvisionLabel(slug: string): string {
  return (
    OPPORTUNITY_EVENT_PARKING_PROVISION_LABELS[
      slug as OpportunityEventParkingProvisionSlug
    ] ?? slug
  );
}
