import { StatusCodes } from "http-status-codes";
import type { Parents, Children } from "@prisma/client";
import AppError from "../../shared/errors/AppError.js";
import type { RecommendationQueryDto } from "./dto.js";
import {
  buildRoutableLeg,
  DrivingLegService,
  metersToMilesOneDecimal,
  type RoutableOpportunityLeg,
} from "./driving-leg.service.js";
import { legKey } from "./driving-leg.repository.js";
import type { RecommendationsRepository } from "./repository.js";
import {
  collectChildrenSkillSlugs,
  collectFamilyInterestSlugs,
  combineNearbyScore,
  combineWeightedScore,
  getAgeInYears,
  haversineDistanceMiles,
  scoreAgeFromSuitabilitySlugs,
  scoreDistanceLinear,
  scoreInterestOverlap,
  scoreSkillOverlap,
} from "./scoring.js";
import type {
  EnrichedScoredRecommendation,
  RecommendationCandidate,
  ScoredRecommendation,
} from "./types.js";

const DEFAULT_LIMIT = 30;

type ParentWithInterests = Parents & {
  interestCategories: { slug: string }[];
  interestSubCategories: { slug: string }[];
  children: (Children & {
    interestCategories: { slug: string }[];
    interestSubCategories: { slug: string }[];
    skills: {
      slug: string;
      minAge: number | null;
      maxAge: number | null;
      subCategory: { slug: string } | null;
    }[];
  })[];
};

type ParentRunContext = {
  parent: ParentWithInterests;
  lat: number;
  lon: number;
  maxDistanceMiles: number;
  limit: number;
  childAges: number[];
};

export class RecommendationsService {
  constructor(
    private readonly repository: RecommendationsRepository,
    private readonly drivingLegs: DrivingLegService = new DrivingLegService(),
  ) {}

  async getRecommendationsForParent(dto: RecommendationQueryDto): Promise<EnrichedScoredRecommendation[]> {
    return this.executeFullRecommendations(dto);
  }

  /** Parent interests plus **all** of the parent's children (ignores any `childId` query on legacy routes). */
  async getRecommendationsForFamily(parentId: string): Promise<EnrichedScoredRecommendation[]> {
    return this.executeFullRecommendations({ parentId });
  }

  /** Parent interests plus a single child (ages, interests, skills for that child only). */
  async getRecommendationsForParentAndChild(
    parentId: string,
    childId: string,
  ): Promise<EnrichedScoredRecommendation[]> {
    return this.executeFullRecommendations({ parentId, childId });
  }

  private async executeFullRecommendations(
    dto: RecommendationQueryDto,
  ): Promise<EnrichedScoredRecommendation[]> {
    const parentRow = (await this.repository.getParentForRecommendations(
      dto.parentId,
      dto.childId,
    )) as ParentWithInterests | null;
    const parentInScope = this.narrowParentToChildrenInScope(parentRow, dto);
    const base = this.assertParentAndBuildContext(parentInScope, dto);

    const familySlugs = collectFamilyInterestSlugs({
      parentCategorySlugs: base.parent.interestCategories.map((x) => x.slug),
      parentSubCategorySlugs: base.parent.interestSubCategories.map((x) => x.slug),
      children: base.parent.children.map((ch) => ({
        interestCategorySlugs: ch.interestCategories.map((x) => x.slug),
        interestSubCategorySlugs: ch.interestSubCategories.map((x) => x.slug),
      })),
    });
    const childSkillSlugs = collectChildrenSkillSlugs({
      children: base.parent.children.map((ch) => ({
        childAgeYears: getAgeInYears(ch.dateOfBirth),
        skills: ch.skills.map((s) => ({
          slug: s.slug,
          minAge: s.minAge,
          maxAge: s.maxAge,
          subCategory: s.subCategory,
        })),
      })),
    });

    // console.log('f1: ', {a: JSON.stringify( {
    //   parentCategorySlugs: base.parent.interestCategories.map((x) => x.slug),
    //   parentSubCategorySlugs: base.parent.interestSubCategories.map((x) => x.slug),
    //   children: base.parent.children.map((ch) => ({
    //     interestCategorySlugs: ch.interestCategories.map((x) => x.slug),
    //     interestSubCategorySlugs: ch.interestSubCategories.map((x) => x.slug),
    //   })),
    // })})
    const candidates = await this.repository.getOpportunityCandidates();
    const routable = this.collectRoutableLegsForFull(base.parent, candidates);
    const drivingMap = await this.drivingLegs.ensureLegsCached(base.parent.id, routable);

    const scored: ScoredRecommendation[] = [];

    for (const c of candidates) {
      const row = this.scoreCandidateFull(c, base, familySlugs, childSkillSlugs);
      if (row) scored.push(row);
    }

    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, base.limit);
    const withDriving = this.mergeDrivingIntoScored(top, drivingMap);
    return this.attachEnrichedOpportunityPayloads(withDriving);
  }

  /**
   * Same pool and radius as full recommendations, but ranks by **distance + child age only**
   * (interests and skills are ignored). `scoreBreakdown.interestScore` and `skillScore` are always `0`.
   * Candidates without numeric `latitude` / `longitude` on the opportunity row are skipped.
   */
  async getRecommendationsForParentNearby(
    dto: RecommendationQueryDto,
  ): Promise<EnrichedScoredRecommendation[]> {
    const parentRow = (await this.repository.getParentForRecommendations(
      dto.parentId,
      dto.childId,
    )) as ParentWithInterests | null;
    const parentInScope = this.narrowParentToChildrenInScope(parentRow, dto);
    const base = this.assertParentAndBuildContext(parentInScope, dto);

    const candidates = await this.repository.getOpportunityCandidates();
    const routable = this.collectRoutableLegsNearby(base.parent, candidates);
    const drivingMap = await this.drivingLegs.ensureLegsCached(base.parent.id, routable);

    const scored: ScoredRecommendation[] = [];

    for (const c of candidates) {
      const row = this.scoreCandidateNearby(c, base);
      if (row) scored.push(row);
    }

    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, base.limit);
    const withDriving = this.mergeDrivingIntoScored(top, drivingMap);
    return this.attachEnrichedOpportunityPayloads(withDriving);
  }

  /**
   * When `dto.childId` is set, keep only that child on `parent.children` so interests, skills, and
   * `childAges` all match a single-child run (repository may already filter; this makes scope explicit).
   */
  private narrowParentToChildrenInScope(
    parent: ParentWithInterests | null,
    dto: RecommendationQueryDto,
  ): ParentWithInterests | null {
    if (!parent) return null;
    if (dto.childId == null || dto.childId === "") return parent;
    return {
      ...parent,
      children: parent.children.filter((c) => c.id === dto.childId),
    };
  }

  private assertParentAndBuildContext(
    parent: ParentWithInterests | null,
    dto: RecommendationQueryDto,
  ): ParentRunContext {
    if (!parent) {
      throw new AppError(StatusCodes.NOT_FOUND, "Parent not found.");
    }
    if (!parent.children.length) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "No children registered for this query. Add at least one child or remove childId filter.",
      );
    }

    const lat = Number.parseFloat(parent.latitude);
    const lon = Number.parseFloat(parent.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "Parent location is invalid; latitude and longitude must be numeric.",
      );
    }

    return {
      parent,
      lat,
      lon,
      maxDistanceMiles: parent.searchRadius,
      limit: DEFAULT_LIMIT,
      childAges: parent.children.map((c) => getAgeInYears(c.dateOfBirth)),
    };
  }

  /** Opportunities must store WGS84 on the row for distance scoring and driving cache. */
  private parseOpportunityLatLon(
    c: RecommendationCandidate,
  ): { latitude: number; longitude: number } | undefined {
    const lat =
      c.latitude != null && c.latitude !== "" ? Number.parseFloat(c.latitude) : Number.NaN;
    const lon =
      c.longitude != null && c.longitude !== "" ? Number.parseFloat(c.longitude) : Number.NaN;
    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      return { latitude: lat, longitude: lon };
    }
    return undefined;
  }

  private scoreCandidateFull(
    c: RecommendationCandidate,
    base: ParentRunContext,
    familySlugs: Set<string>,
    childSkillSlugs: Set<string>,
  ): ScoredRecommendation | null {
    const oppCoords = this.parseOpportunityLatLon(c);
    if (!oppCoords) return null;

    const distanceMiles = haversineDistanceMiles(
      base.lat,
      base.lon,
      oppCoords.latitude,
      oppCoords.longitude,
    );
    if (distanceMiles > base.maxDistanceMiles) return null;

    const interestScore = Math.round(
      scoreInterestOverlap(familySlugs, c.interestTags, c.themeSlug),
    );
    const skillScore = Math.round(
      scoreSkillOverlap(childSkillSlugs, c.skillAreaSlug, c.skillAreaVariant),
    );
    const ageScore = Math.round(scoreAgeFromSuitabilitySlugs(base.childAges, c.ageSuitabilitySlugs));
    const distanceScore = Math.round(scoreDistanceLinear(distanceMiles, base.maxDistanceMiles));

    const total = combineWeightedScore(interestScore, skillScore, ageScore, distanceScore);

    // console.log('c1 1:interestScore: ', {interestScore, familySlugs, tags: c.interestTags, theme: c.themeSlug })
    // console.log('c1 2:skillScore: ', {skillScore, childSkillSlugs, skillAreaSlug: c.skillAreaSlug, skillAreaVariant: c.skillAreaVariant })
    // console.log('c1 3: ageScore: ', { ageScore, childeAges: base.childAges, ageSuitabilitySlugs: c.ageSuitabilitySlugs })
    // console.log('c1: 4: distanceScore: ', {distanceScore, distanceMiles, maxDistanceMiles: base.maxDistanceMiles })
    // console.log('c1: ', {total, interestScore, skillScore, ageScore, distanceScore })
 
    return {
      type: c.type,
      id: c.id,
      name: c.name,
      description: c.description,
      postcode: c.postcode,
      distanceMiles: Math.round(distanceMiles * 10) / 10,
      drivingDistanceMiles: null,
      drivingDurationSeconds: null,
      score: total,
      scoreBreakdown: {
        interestScore,
        skillScore,
        ageScore,
        distanceScore,
        total,
      },
    };
  }

  private scoreCandidateNearby(
    c: RecommendationCandidate,
    base: ParentRunContext,
  ): ScoredRecommendation | null {
    const oppCoords = this.parseOpportunityLatLon(c);
    if (!oppCoords) return null;

    const distanceMiles = haversineDistanceMiles(
      base.lat,
      base.lon,
      oppCoords.latitude,
      oppCoords.longitude,
    );
    if (distanceMiles > base.maxDistanceMiles) return null;

    const ageScore = Math.round(scoreAgeFromSuitabilitySlugs(base.childAges, c.ageSuitabilitySlugs));
    const distanceScore = Math.round(scoreDistanceLinear(distanceMiles, base.maxDistanceMiles));
    const total = combineNearbyScore(ageScore, distanceScore);

    return {
      type: c.type,
      id: c.id,
      name: c.name,
      description: c.description,
      postcode: c.postcode,
      distanceMiles: Math.round(distanceMiles * 10) / 10,
      drivingDistanceMiles: null,
      drivingDurationSeconds: null,
      score: total,
      scoreBreakdown: {
        interestScore: 0,
        skillScore: 0,
        ageScore,
        distanceScore,
        total,
      },
    };
  }

  private collectRoutableLegsForFull(
    parent: ParentWithInterests,
    candidates: RecommendationCandidate[],
  ): RoutableOpportunityLeg[] {
    const legs: RoutableOpportunityLeg[] = [];
    for (const c of candidates) {
      const r = this.parseOpportunityLatLon(c);
      if (!r) continue;
      legs.push(buildRoutableLeg(parent, c.type, c.id, c.postcode, r));
    }
    return legs;
  }

  private collectRoutableLegsNearby(
    parent: ParentWithInterests,
    candidates: RecommendationCandidate[],
  ): RoutableOpportunityLeg[] {
    const legs: RoutableOpportunityLeg[] = [];
    for (const c of candidates) {
      const r = this.parseOpportunityLatLon(c);
      if (!r) continue;
      legs.push(buildRoutableLeg(parent, c.type, c.id, c.postcode, r));
    }
    return legs;
  }

  private mergeDrivingIntoScored(
    rows: ScoredRecommendation[],
    drivingMap: Map<string, { drivingDistanceMeters: number; drivingDurationSeconds: number }>,
  ): ScoredRecommendation[] {
    return rows.map((row) => {
      const d = drivingMap.get(legKey(row.type, row.id));
      if (!d) {
        return row;
      }
      return {
        ...row,
        drivingDistanceMiles: metersToMilesOneDecimal(d.drivingDistanceMeters),
        drivingDurationSeconds: d.drivingDurationSeconds,
      };
    });
  }

  private async attachEnrichedOpportunityPayloads(
    rows: ScoredRecommendation[],
  ): Promise<EnrichedScoredRecommendation[]> {
    if (rows.length === 0) return [];
    const refs = rows.map((r) => ({ type: r.type, id: r.id }));
    const map = await this.repository.getEnrichedOpportunityPayloadsForRecommendations(refs);
    const out: EnrichedScoredRecommendation[] = [];
    for (const row of rows) {
      const base = map.get(legKey(row.type, row.id));
      if (!base) {
        throw new AppError(
          StatusCodes.INTERNAL_SERVER_ERROR,
          `Recommendation opportunity payload missing for ${row.type} ${row.id}.`,
        );
      }
      out.push({
        ...base,
        distanceMiles: row.distanceMiles,
        drivingDistanceMiles: row.drivingDistanceMiles,
        drivingDurationSeconds: row.drivingDurationSeconds,
        score: row.score,
        scoreBreakdown: row.scoreBreakdown,
      });
    }
    return out;
  }
}
