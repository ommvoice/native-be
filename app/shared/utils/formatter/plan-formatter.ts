import type { Opportunity } from "./recommendation-formatter.js";
import type { SlugName } from "../slug-name.js";
import { AssetsService } from "../../../services/assets.service.js";
import { isEventVisible, type EventVisibilityFields } from "../event-visibility.js";
import { isClubVisible, type ClubVisibilityFields } from "../club-visibility.js";

const assets = new AssetsService();

/**
 * Whether an opportunity belongs in the plan at `now`. The formatted Opportunity doesn't carry the
 * date/time fields this needs, so the raw record is looked up by id (Opportunity.id is the asset id).
 *   - Events: shown from their promotion start (ticket_sales_start_date 00:00) until 1 hour before
 *     they finish on their end date — see isEventVisible().
 *   - Clubs: shown from 7 days before their start date (00:00) until their last session finishes on
 *     their end date — see isClubVisible().
 *   - Venues, routes, and events/clubs missing from the assets: always shown.
 */
function isOpportunityVisible(
  opp: Opportunity,
  eventsById: Map<string, EventVisibilityFields>,
  clubsById: Map<string, ClubVisibilityFields>,
  now: Date,
): boolean {
  if (opp.type === "event") {
    const raw = eventsById.get(opp.id);
    return raw ? isEventVisible(raw, now) : true;
  }
  if (opp.type === "club") {
    const raw = clubsById.get(opp.id);
    return raw ? isClubVisible(raw, now) : true;
  }
  return true;
}

export interface PlanGroupTheme {
  name: string;
  slug: string;
  /** Every variant of this theme, per the canonical `opportunityThemeVariant` taxonomy (not just
   * ones seen on this group's opportunities) — powers the Interests filter's subcategory checklist
   * (nativeapp-main-2's ExploreLocalGuide.tsx InlineGridView "Interests Section": category = theme,
   * subcategory = variant). */
  variants: SlugName[];
}

export interface PlanGroup {
  interest: SlugName;
  themes: PlanGroupTheme[];
  list: Opportunity[];
}

/** Every theme belonging to an interest category, each with its own full variant list — resolved
 * from the static `opportunityTheme`/`opportunityThemeVariant` enum taxonomy (via AssetsService,
 * the same `interestCategorySlugs`/`opportunityThemeSlugs` relationships resolveInterestCategory()
 * uses) rather than from whatever happens to appear on the current opportunity list — so the
 * Interests filter always shows every option, not just the ones already represented in results. */
function resolveThemesForInterest(interestSlug: string): PlanGroupTheme[] {
  return assets.getInterestSubCategories(interestSlug).map((theme) => ({
    slug: theme.slug,
    name: theme.name,
    variants: assets.getThemeVariants(theme.slug).map((variant) => ({ slug: variant.slug, name: variant.name })),
  }));
}

/**
 * One group per interest category defined in the taxonomy (`assets.getInterestCategories()`), not
 * just the ones represented among `opportunities` — every interest category is always present,
 * with `list` filtered down to that category's matching opportunities (empty if none match).
 * Mirrors nativeapp-main-2's `EVERYTHING_LOCAL_DISPLAY_GROUPS`, which is a fixed display list
 * rendered regardless of whether a group currently has any opportunities (empty ones render as
 * a "Coming soon" row client-side) — themes/variants are resolved the same asset-driven way.
 * An opportunity with no resolvable interest category (`searchTags.interestCategories` empty via
 * recommendation-formatter's resolveInterestCategories()) is dropped — it can't be placed in any group.
 * An opportunity whose theme spans multiple interest categories appears in every matching group's
 * `list`, not just one — see resolveInterestCategories().
 * Events and clubs outside their visibility window are left out of every group — see
 * isOpportunityVisible(). `now` is only overridden in tests.
 */


export async function groupOpportunitiesByInterest(opportunities: Opportunity[], now: Date = new Date()): Promise<PlanGroup[]> {
  // Loaded once per call (not per opportunity) — getEventBySlug/getClubBySlug would re-scan every record each time.
  const [events, clubs] = await Promise.all([assets.getAllEvents(), assets.getAllClubs()]);
  const eventsById = new Map<string, EventVisibilityFields>(events.map((e) => [e.id, e as EventVisibilityFields]));
  const clubsById = new Map<string, ClubVisibilityFields>(clubs.map((c) => [c.id, c as ClubVisibilityFields]));
  const list = opportunities.filter((opp) => isOpportunityVisible(opp, eventsById, clubsById, now));
  
  return assets.getInterestCategories().map((interest): PlanGroup => ({
    interest: { slug: interest.slug, name: interest.name },
    themes: resolveThemesForInterest(interest.slug),
    list: list.filter((opp) => opp.searchTags.interestCategories.some((c) => c.slug === interest.slug)),
  }));
}

