import { RecommendationV2Repository } from "../repositories/recommendation-v2.repository";
import { groupOpportunitiesByInterest, PlanGroup } from "../shared/utils/formatter/plan-formatter";
import { Opportunity } from "../shared/utils/formatter/recommendation-formatter";

export class PlanService {
  private readonly recommendationsRepo: RecommendationV2Repository;
  
    constructor() {
      this.recommendationsRepo = new RecommendationV2Repository();
    }


  async getSingleFamilyMemberRecommendations({parentId, childId}: { parentId: string; childId?: string }, list:Opportunity[]): Promise<PlanGroup[]> {

    const parent = await this.recommendationsRepo.getParentForRecommendations(parentId, childId);
    let intrestCategories= parent?.interestCategories?.map((x)=> x.slug) ?? [];

    // Themes shown — only these, nothing else:
    //   - no childId: the parent's picks only
    //   - childId: that child's picks only
    let themes = new Set(parent?.interestSubCategories?.map((x) => x.slug) ?? []);

    if (childId) {
      const child = parent?.children.find((x) => x.id === childId) ;
      intrestCategories= child?.interestCategories?.map((x)=> x.slug) ?? [];
      themes = new Set(child?.interestSubCategories?.map((x) => x.slug) ?? []);
    }

  const activeGroups = (await groupOpportunitiesByInterest(list))
    .filter((group) => intrestCategories.includes(group.interest.slug))
    .map((group) => ({
      ...group,
      // Theme filter chips and the opportunities themselves: selected themes only (none picked → nothing).
      themes: group.themes.filter((theme) => themes.has(theme.slug)),
      list: group.list
        // .filter((opp) => !!opp.theme && themes.has(opp.theme.slug))
        .sort((a, b) => (b.score || 0) - (a.score || 0)),
    }));

    return activeGroups;
  }
}
