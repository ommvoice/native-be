import type { Opportunity } from "./recommendation-formatter.js";
import type { SlugName } from "../slug-name.js";
import { AssetsService } from "../../../services/assets.service.js";

const assets = new AssetsService();

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
 * An opportunity with no resolvable interest category (`searchTags.interestCategory` unset via
 * recommendation-formatter's resolveInterestCategory()) is dropped — it can't be placed in any group.
 */
export function groupOpportunitiesByInterest(opportunities: Opportunity[]): PlanGroup[] {
  return assets.getInterestCategories().map((interest): PlanGroup => ({
    interest: { slug: interest.slug, name: interest.name },
    themes: resolveThemesForInterest(interest.slug),
    list: opportunities.filter((opp) => opp.searchTags.interestCategory?.slug === interest.slug),
  }));
}
