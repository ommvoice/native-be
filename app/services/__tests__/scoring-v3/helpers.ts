import { afterEach, beforeEach, vi } from 'vitest';
import * as S from '../../scoring-v3.service';
import fixtures from './fixtures/candidates.json' with { type: 'json' };
import params from '../../../shared/assets/params.json' with { type: 'json' };
import enums from '../../../shared/assets/enums.json' with { type: 'json' };
import type { RecommendationV2Candidate } from '../../../dtos/recommendation.dto';

/**
 * Shared test data for the scoring-v3 tests: real candidates from the JSON assets
 * (fixtures/candidates.json — captured on Saturday 2026-10-24 15:00 UK, so startTime/endTime are that
 * day's) and the params.json family.
 */

export const candidates = fixtures.candidates as unknown as RecommendationV2Candidate[];

export function cand(type: RecommendationV2Candidate['type'], id: string): RecommendationV2Candidate {
  const c = candidates.find((x) => x.type === type && x.id === id);
  if (!c) throw new Error(`fixture ${type}:${id} missing`);
  return c;
}

export const tenpin = cand('venue', 'tenpin_bowling');          // inside, 5–adults, open 10:00–01:00 (past midnight)
export const exmouthBeach = cand('venue', 'exmouth_beach');     // outside, all ages, comma-joined theme variants
export const estuaryRoute = cand('route', 'exe_estuary_trail_exton_to_lympstone'); // outside route, tag "cycling"
export const kiaOra = cand('event', 'kia_ora_farm_gardens_3');  // single-day event 2026-08-16, 14:00–17:30
export const littleGems = cand('club', 'little_gems_playgroup'); // Fridays 09:30–11:00, ages 0–4
export const oceanSoftplayClub = cand('club', 'ocean_softplay'); // multi-session schedule → no activeDays/coords
export const bicton = cand('venue', 'bicton_botanical_park_gardens'); // mixed_covering

export const family = params.narrowed;
/** Counted interest members of the params.json family: parent + 3 children (all have interests). */
export const familyMembers = S.interestMembersOf(family as any);
/** opportunityTheme slug → interest category slugs, from enums.json (what V2 builds via AssetsService). */
export const themeCategories = new Map<string, string[]>(
  (enums.opportunityTheme as { slug: string; interestCategorySlugs?: string[] }[]).map((t) => [t.slug, t.interestCategorySlugs ?? []]),
);
/** Opportunity side of the interest match for a fixture candidate. */
export const oppInterest = (c: RecommendationV2Candidate) => S.opportunityInterestOf(c.themeSlug, c.themeVariantSlug, themeCategories);
export const familyTagWeights = S.buildChildTagWeights(family.children.map((c) => c.interestTags ?? []));

/** A moment given as UK wall clock with its explicit offset (BST +01:00 / GMT +00:00). */
export const uk = (iso: string) => new Date(iso);
/** The fixture capture time — params.json children are 8, 3 and 5 on this date. */
export const SAT_15_00 = uk('2026-10-24T15:00:00+01:00');

/** Freezes the clock at SAT_15_00 for every test in the file (tests can move it with vi.setSystemTime). */
export function useFixedClock(): void {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(SAT_15_00);
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });
}
