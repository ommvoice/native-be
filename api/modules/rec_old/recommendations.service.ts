import type { Opportunity, Children } from "@prisma/client";
import AppError from "../../shared/errors/AppError.js";
import { StatusCodes } from "http-status-codes";
import type { RecommendationsRepository } from "./recommendations.repository.js";
import type {
  RecommendationRequestDto,
  ScoredOpportunity,
  ScoreBreakdown,
} from "./recommendations.dto.js";

const WEIGHTS = {
  age: 35,
  distance: 30,
  cost: 15,
  effort: 10,
  accessibility: 10,
} as const;

/** Mean Earth radius for great-circle distance in **miles** (WGS84). */
const R_MILES = 3958.7613;

const DEFAULT_LIMIT = 20;

export class RecommendationsService {
  constructor(private repository: RecommendationsRepository) {}

  async getRecommendations(
    dto: RecommendationRequestDto,
  ): Promise<ScoredOpportunity[]> {
    const parent = await this.repository.getParentWithChildren(dto.parentId);
    if (!parent) {
      throw new AppError(StatusCodes.NOT_FOUND, "Parent not found.");
    }
    if (!parent.children.length) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "No children registered. Add at least one child to get recommendations.",
      );
    }

    const originLon = Number.parseFloat(parent.longitude);
    if (!Number.isFinite(originLon)) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "Parent longitude is invalid; it must be numeric.",
      );
    }

    const opportunities = await this.repository.getActiveOpportunities();
    const maxDistanceMiles = parent.searchRadius;
    const limit = DEFAULT_LIMIT;
    const childrenAges = parent.children.map((c) => getAgeInYears(c.dateOfBirth));
    const youngestAge = Math.min(...childrenAges);
    const needsBuggy = youngestAge < 3;

    const scored: ScoredOpportunity[] = [];

    for (const opp of opportunities) {
      if (!opp.latitude || !opp.longitude) continue;

      const distanceMiles = haversineDistanceMiles(
        dto.latitude,
        originLon,
        opp.latitude,
        opp.longitude,
      );

      if (distanceMiles > maxDistanceMiles) continue;

      if (dto.categories?.length) {
        const matchesCategory = dto.categories.some(
          (cat) =>
            opp.category === cat ||
            opp.oppCategory === cat ||
            opp.interestCategory === cat,
        );
        if (!matchesCategory) continue;
      }

      const breakdown = calculateScoreBreakdown(
        opp,
        childrenAges,
        distanceMiles,
        maxDistanceMiles,
        needsBuggy,
      );

      scored.push({
        id: opp.id,
        name: opp.name,
        description: opp.description,
        category: opp.category,
        city: opp.city,
        distanceMiles: Math.round(distanceMiles * 10) / 10,
        isFree: opp.isFree,
        entryCost: opp.entryCost,
        activityEffortTag: opp.activityEffortTag,
        estimatedVisitDuration: opp.estimatedVisitDuration,
        imageUrls: opp.imageUrls,
        score: breakdown.total,
        scoreBreakdown: breakdown,
      });
    }

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, limit);
  }
}

// --- Scoring functions (exported for unit testing) ---

export function calculateScoreBreakdown(
  opp: Opportunity,
  childrenAges: number[],
  distanceMiles: number,
  maxDistanceMiles: number,
  needsBuggy: boolean,
): ScoreBreakdown {
  const ageScore = scoreAge(opp, childrenAges);
  const distanceScore = scoreDistance(distanceMiles, maxDistanceMiles);
  const costScore = scoreCost(opp, false);
  const effortScore = scoreEffort(opp, childrenAges);
  const accessibilityScore = scoreAccessibility(opp, needsBuggy);

  const total = Math.round(
    ageScore * (WEIGHTS.age / 100) +
      distanceScore * (WEIGHTS.distance / 100) +
      costScore * (WEIGHTS.cost / 100) +
      effortScore * (WEIGHTS.effort / 100) +
      accessibilityScore * (WEIGHTS.accessibility / 100),
  );

  return {
    ageScore: Math.round(ageScore),
    distanceScore: Math.round(distanceScore),
    costScore: Math.round(costScore),
    effortScore: Math.round(effortScore),
    accessibilityScore: Math.round(accessibilityScore),
    total,
  };
}

/**
 * Age score (0-100):
 *  - 100 if ALL children fall within the opportunity's age range
 *  - Partial credit per child; slight grace of ±1 year at the boundaries
 *  - Routes with no age limits get full marks
 */
export function scoreAge(opp: Opportunity, childrenAges: number[]): number {
  if (opp.minAge == null && opp.maxAge == null) return 100;

  const min = opp.minAge ?? 0;
  const max = opp.maxAge ?? 18;
  let totalScore = 0;

  for (const age of childrenAges) {
    if (age >= min && age <= max) {
      totalScore += 100;
    } else {
      const distanceFromRange = age < min ? min - age : age - max;
      const penalty = Math.min(distanceFromRange * 30, 100);
      totalScore += Math.max(0, 100 - penalty);
    }
  }

  return totalScore / childrenAges.length;
}

/**
 * Distance score (0-100): linear decay from 100 at 0 mi to 0 at `maxDistanceMiles`.
 * Closer places always score higher.
 */
export function scoreDistance(distanceMiles: number, maxDistanceMiles: number): number {
  if (maxDistanceMiles <= 0) return 0;
  if (distanceMiles <= 0) return 100;
  if (distanceMiles >= maxDistanceMiles) return 0;
  return 100 * (1 - distanceMiles / maxDistanceMiles);
}

/**
 * Cost score (0-100):
 *  - Free opportunities always score 100
 *  - Paid opportunities score 60 normally, 30 if user prefers free
 */
export function scoreCost(opp: Opportunity, preferFree: boolean): number {
  if (opp.isFree) return 100;
  return preferFree ? 30 : 60;
}

/**
 * Effort score (0-100):
 * Maps effort tag suitability to the youngest child's age.
 *  - Under-5s: low_effort = 100, energy_burner = 50, special_day_out = 70
 *  - 5-10: low_effort = 70, energy_burner = 100, special_day_out = 90
 *  - 10+: all score well, energy_burner slightly favoured
 */
export function scoreEffort(opp: Opportunity, childrenAges: number[]): number {
  if (!opp.activityEffortTag) return 70;

  const youngestAge = Math.min(...childrenAges);
  const tag = opp.activityEffortTag;

  const effortMatrix: Record<string, Record<string, number>> = {
    low_effort: { under5: 100, age5to10: 70, over10: 60 },
    energy_burner: { under5: 50, age5to10: 100, over10: 90 },
    special_day_out: { under5: 70, age5to10: 90, over10: 100 },
    new_adventure: { under5: 60, age5to10: 85, over10: 95 },
  };

  const ageGroup =
    youngestAge < 5 ? "under5" : youngestAge < 10 ? "age5to10" : "over10";

  return effortMatrix[tag]?.[ageGroup] ?? 70;
}

/**
 * Accessibility score (0-100):
 *  - 100 if buggy-friendly and family needs buggy (youngest < 3)
 *  - 80 base for buggy-friendly regardless
 *  - 50 if not buggy-friendly but family needs it
 *  - 70 default
 */
export function scoreAccessibility(opp: Opportunity, needsBuggy: boolean): number {
  const supportsBuggy = opp.suitableFor.some((s) =>
    s.toLowerCase().includes("buggy") || s.toLowerCase().includes("buggies"),
  );

  if (needsBuggy && supportsBuggy) return 100;
  if (needsBuggy && !supportsBuggy) return 30;
  if (supportsBuggy) return 80;
  return 70;
}

// --- Utilities ---

export function getAgeInYears(dateOfBirth: Date): number {
  const today = new Date();
  let age = today.getFullYear() - dateOfBirth.getFullYear();
  const monthDiff = today.getMonth() - dateOfBirth.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())
  ) {
    age--;
  }
  return Math.max(0, age);
}

/**
 * Haversine formula: great-circle distance between two lat/lng points in **miles**.
 */
export function haversineDistanceMiles(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;

  return R_MILES * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180);
}
