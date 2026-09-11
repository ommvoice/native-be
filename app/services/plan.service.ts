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
    let themes= parent?.interestSubCategories.map((x) => x.slug) ?? [];

    if (childId) {
      const child = parent?.children.find((x) => x.id === childId) ;
      intrestCategories= child?.interestCategories?.map((x)=> x.slug) ?? [];
      themes= child?.interestSubCategories.map((x) => x.slug) ?? [];
    }

  const activeGroups = groupOpportunitiesByInterest(list)
    .filter((group) => intrestCategories.includes(group.interest.slug));

    return activeGroups;
  }
}
