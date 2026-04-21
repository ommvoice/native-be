import type { OpportunitySearchCandidateRow } from "./types.js";

/** True if `slug` appears on any of the four opportunity facility slug arrays (case-insensitive). */
export function candidateMatchesFacilitySlug(
  c: Pick<
    OpportunitySearchCandidateRow,
    | "generalFacilitySlugs"
    | "kidsFacilitySlugs"
    | "parentFacilitySlugs"
    | "dogFacilitySlugs"
  >,
  facilitySlug: string,
): boolean {
  const want = facilitySlug.trim().toLowerCase();
  if (!want) return true;
  const pools = [
    ...c.generalFacilitySlugs,
    ...c.kidsFacilitySlugs,
    ...c.parentFacilitySlugs,
    ...c.dogFacilitySlugs,
  ];
  return pools.some((s) => s.trim().toLowerCase() === want);
}

/** True if the candidate lists at least one of `facilitySlugs` (OR). Empty list means no filter. */
export function candidateMatchesFacilitySlugs(
  c: Pick<
    OpportunitySearchCandidateRow,
    | "generalFacilitySlugs"
    | "kidsFacilitySlugs"
    | "parentFacilitySlugs"
    | "dogFacilitySlugs"
  >,
  facilitySlugs: string[],
): boolean {
  if (facilitySlugs.length === 0) return true;
  return facilitySlugs.some((slug) => candidateMatchesFacilitySlug(c, slug));
}
