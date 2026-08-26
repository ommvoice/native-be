/** Which of the 4 opportunity tables (venues/events/clubs/routes) a saved reference points at —
 * the same discriminant used throughout recommendations (see driving-leg.repository.ts's
 * OpportunityRecordType). Declared independently here (not imported from a repository file) so this
 * shared util has no dependency on any one repository — matches how recommendation.dto.ts and
 * driving-leg.repository.ts each already declare the same literal union independently. */
export type OpportunityRefType = 'venue' | 'event' | 'club' | 'route';

/** The 4-nullable-column shape wishlist items / visit intentions / opportunity interactions all use
 * to reference a venue/event/club/route row — exactly one column is set per record. */
export interface OpportunityRefColumns {
  opportunityVenueId: string | null;
  opportunityEventId: string | null;
  opportunityClubId: string | null;
  opportunityRouteId: string | null;
}

export function toOpportunityRefColumns(type: OpportunityRefType, id: string): OpportunityRefColumns {
  return {
    opportunityVenueId: type === 'venue' ? id : null,
    opportunityEventId: type === 'event' ? id : null,
    opportunityClubId: type === 'club' ? id : null,
    opportunityRouteId: type === 'route' ? id : null,
  };
}

export function resolveOpportunityRef(row: OpportunityRefColumns): { type: OpportunityRefType; id: string } | null {
  if (row.opportunityVenueId) return { type: 'venue', id: row.opportunityVenueId };
  if (row.opportunityEventId) return { type: 'event', id: row.opportunityEventId };
  if (row.opportunityClubId) return { type: 'club', id: row.opportunityClubId };
  if (row.opportunityRouteId) return { type: 'route', id: row.opportunityRouteId };
  return null;
}

/** Deterministic id builder — used as the DynamoDB primary key (or a key segment) so
 * add/set/remove-by-reference is a plain Put/Delete instead of a lookup-then-mutate, and re-adding
 * the same opportunity naturally overwrites instead of duplicating. */
export function opportunityRefKey(type: OpportunityRefType, id: string): string {
  return `${type}#${id}`;
}
