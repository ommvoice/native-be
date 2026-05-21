import { StatusCodes } from "http-status-codes";
import AppError from "../../shared/errors/AppError.js";
import type { RecommendationQueryDto } from "./dto.js";
import {
  buildRoutableLeg,
  DrivingLegService,
  metersToMilesOneDecimal,
  type RoutableOpportunityLeg,
} from "./driving-leg.service.js";
import { legKey } from "./driving-leg-keys.js";
import type { RecommendationV2Candidate, ScoredRecommendation } from "./types.js";
import {
  collectFamilyInterestSlugs,
  combineWeightedScore,
  getAgeInYears,
  haversineDistanceMiles,
  scoreAgeFromV2AgeBands,
  scoreDistanceLinear,
  scoreInterestOverlapFromV2ThemeSlugs,
} from "./scoring.js";
import type { RecommendationsV2Repository } from "./repository.js";
import type { EnrichedScoredRecommendationV2 } from "./types.js";

const DEFAULT_LIMIT = 30;

type ParentWithInterests = {
  id: string;
  postCode: string;
  latitude: string;
  longitude: string;
  searchRadius: number;
  interestCategories: { slug: string }[];
  interestSubCategories: { slug: string }[];
  children: {
    id: string;
    dateOfBirth: Date;
    interestCategories: { slug: string }[];
    interestSubCategories: { slug: string }[];
    skills: {
      slug: string;
      minAge: number | null;
      maxAge: number | null;
      subCategory: { slug: string } | null;
    }[];
  }[];
};

type ParentRunContext = {
  parent: ParentWithInterests;
  lat: number;
  lon: number;
  maxDistanceMiles: number;
  limit: number;
  childAges: number[];
};

export class RecommendationsV2Service {
  constructor(
    private readonly repository: RecommendationsV2Repository,
    private readonly drivingLegs: DrivingLegService = new DrivingLegService(),
  ) {}

  async getRecommendationsForParent(dto: RecommendationQueryDto): Promise<EnrichedScoredRecommendationV2[]> {
    const parentRow = (await this.repository.getParentForRecommendations(
      dto.parentId,
      dto.childId,
    )) as ParentWithInterests | null;
    const parentInScope = this.narrowParentToChildrenInScope(parentRow, dto);
    const base = this.assertParentAndBuildContext(parentInScope, dto);

    const familyInterestSlugs = collectFamilyInterestSlugs({
      parentCategorySlugs: base.parent.interestCategories.map((x) => x.slug),
      parentSubCategorySlugs: base.parent.interestSubCategories.map((x) => x.slug),
      children: base.parent.children.map((ch) => ({
        interestCategorySlugs: ch.interestCategories.map((x) => x.slug),
        interestSubCategorySlugs: ch.interestSubCategories.map((x) => x.slug),
      })),
    });

    const candidates = await this.repository.getOpportunityCandidatesV2();
    const routable = this.collectRoutableLegsForFull(base.parent, candidates);
    const drivingMap = await this.drivingLegs.ensureLegsCached(base.parent.id, routable);
    const scored: ScoredRecommendation[] = [];

    for (const c of candidates) {
      const row = this.scoreCandidateFull(c, base, familyInterestSlugs);
      if (row?.score === 0) continue;
      if (row) scored.push(row);
    }

    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, base.limit);
    const withDriving = this.mergeDrivingIntoScored(top, drivingMap);
    return this.attachEnrichedOpportunityPayloads(withDriving);
  }

  async getRecommendationsForParentAndChild(
    parentId: string,
    childId: string,
  ): Promise<EnrichedScoredRecommendationV2[]> {
    return this.getRecommendationsForParent({ parentId, childId });
  }

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

  private parseOpportunityLatLon(
    c: RecommendationV2Candidate,
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
    c: RecommendationV2Candidate,
    base: ParentRunContext,
    familyInterestSlugs: Set<string>,
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
      scoreInterestOverlapFromV2ThemeSlugs(
        familyInterestSlugs,
        c.themeSlug,
        c.themeVariantSlug,
      ),
    );
    const ageScore = Math.round(scoreAgeFromV2AgeBands(base.childAges, c.ageBands));
    const distanceScore = Math.round(scoreDistanceLinear(distanceMiles, base.maxDistanceMiles));

    const total = combineWeightedScore(interestScore, ageScore, distanceScore);
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
        ageScore,
        distanceScore,
        total,
      },
    };
  }

  private collectRoutableLegsForFull(
    parent: ParentWithInterests,
    candidates: RecommendationV2Candidate[],
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
      if (!d) return row;
      return {
        ...row,
        drivingDistanceMiles: metersToMilesOneDecimal(d.drivingDistanceMeters),
        drivingDurationSeconds: d.drivingDurationSeconds,
      };
    });
  }

  private async attachEnrichedOpportunityPayloads(
    rows: ScoredRecommendation[],
  ): Promise<EnrichedScoredRecommendationV2[]> {
    if (rows.length === 0) return [];
    const refs = rows.map((r) => ({ type: r.type, id: r.id }));
    const map = await this.repository.getEnrichedOpportunityPayloadsForRecommendationsV2(refs);
    const out: EnrichedScoredRecommendationV2[] = [];
    for (const row of rows) {
      const payload = map.get(legKey(row.type, row.id));
      if (!payload) {
        throw new AppError(
          StatusCodes.INTERNAL_SERVER_ERROR,
          `Recommendation opportunity payload missing for ${row.type} ${row.id}.`,
        );
      }
      out.push({
        ...payload,
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
