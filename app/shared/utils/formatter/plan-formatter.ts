import type { Opportunity } from "./recommendation-formatter";
import type { SlugName } from "../slug-name";

export interface PlanGroup {
  interest: SlugName;
  themes: SlugName[];
  list: Opportunity[];
}

/**
 * Groups already-formatted Opportunity rows by their resolved interest category
 * (`searchTags.interestCategory`, set via recommendation-formatter's
 * resolveInterestCategory()). Items with no resolvable interest category are
 * dropped — they can't be placed in an `{interest, themes, list}` group.
 */
export function groupOpportunitiesByInterest(opportunities: Opportunity[]): PlanGroup[] {
  const groups = new Map<string, PlanGroup>();

  for (const opp of opportunities) {
    const interest = opp.searchTags.interestCategory;
    if (!interest) continue;

    let group = groups.get(interest.slug);
    if (!group) {
      group = { interest, themes: [], list: [] };
      groups.set(interest.slug, group);
    }

    if (opp.theme && !group.themes.some((t) => t.slug === opp.theme!.slug)) {
      group.themes.push({ name: opp.theme.name, slug: opp.theme.slug });
    }

    group.list.push(opp);
  }

  return Array.from(groups.values());
}
