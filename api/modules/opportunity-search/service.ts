import { StatusCodes } from "http-status-codes";
import AppError from "../../shared/errors/AppError.js";
import { legKey } from "../recommendations/driving-leg.repository.js";
import { metersToMilesOneDecimal } from "../recommendations/driving-leg.service.js";
import { RecommendationsRepository } from "../recommendations/repository.js";
import { haversineDistanceMiles, matchesInterestSubCategorySlug } from "../recommendations/scoring.js";
import { candidateMatchesFacilitySlugs } from "./facility-match.js";
import {
  maxDrivingDistanceMetersFromMiles,
  OpportunitySearchRepository,
} from "./repository.js";
import type {
  OpportunitySearchCandidateRow,
  OpportunitySearchQueryDto,
  OpportunitySearchResultItem,
} from "./types.js";

export type OpportunitySearchRepositoryLike = Pick<
  OpportunitySearchRepository,
  | "findParentLatLon"
  | "listDrivingLegsForParent"
  | "findCandidatesByRefs"
  | "findChildInterestSubCategorySlugs"
  | "findFacilityBySlug"
>;

export type RecommendationsEnrichLike = Pick<
  RecommendationsRepository,
  "getEnrichedOpportunityPayloadsForRecommendations"
>;

export class OpportunitySearchService {
  constructor(
    private readonly searchRepo: OpportunitySearchRepositoryLike,
    private readonly enrichRepo: RecommendationsEnrichLike,
  ) {}

  async search(dto: OpportunitySearchQueryDto): Promise<OpportunitySearchResultItem[]> {
    const parent = await this.searchRepo.findParentLatLon(dto.parentId);
    if (!parent) {
      throw new AppError(StatusCodes.NOT_FOUND, "Parent not found.");
    }

    if (dto.childId) {
      const childSlugs = await this.searchRepo.findChildInterestSubCategorySlugs(
        dto.parentId,
        dto.childId,
      );
      if (!childSlugs) {
        throw new AppError(StatusCodes.NOT_FOUND, "Child not found for this parent.");
      }
      const slug = dto.interestSubCategorySlug?.trim();
      if (slug) {
        const want = slug.toLowerCase();
        const ok = childSlugs.some((s) => s.trim().toLowerCase() === want);
        if (!ok) {
          throw new AppError(
            StatusCodes.BAD_REQUEST,
            "Interest subcategory is not linked to this child.",
          );
        }
      }
    }

    const facilitySlugs = dto.facility ?? [];
    for (const slug of facilitySlugs) {
      const fac = await this.searchRepo.findFacilityBySlug(slug);
      if (!fac) {
        throw new AppError(StatusCodes.BAD_REQUEST, "Unknown facility slug.");
      }
    }

    const profileParentLat = Number.parseFloat(parent.latitude);
    const profileParentLon = Number.parseFloat(parent.longitude);
    if (!Number.isFinite(profileParentLat) || !Number.isFinite(profileParentLon)) {
      throw new AppError(
        StatusCodes.BAD_REQUEST,
        "Parent location is invalid; latitude and longitude must be numeric.",
      );
    }

    const maxDurationSeconds =
      dto.maxTimeToReachMinutes != null
        ? Math.floor(dto.maxTimeToReachMinutes * 60)
        : undefined;
    const maxDistanceMeters =
      dto.maxDistanceMiles != null
        ? maxDrivingDistanceMetersFromMiles(dto.maxDistanceMiles)
        : undefined;

    const legs = await this.searchRepo.listDrivingLegsForParent(dto.parentId, {
      ...(maxDurationSeconds != null ? { maxDurationSeconds } : {}),
      ...(maxDistanceMeters != null ? { maxDistanceMeters } : {}),
    });

    const refs = legs.map((l) => ({ type: l.opportunityType, id: l.opportunityId }));
    const candidates = await this.searchRepo.findCandidatesByRefs(refs);
    const candidateByKey = new Map<string, OpportunitySearchCandidateRow>();
    for (const c of candidates) {
      candidateByKey.set(legKey(c.type, c.id), c);
    }

    const interestSlug = dto.interestSubCategorySlug?.trim();
    const matchedRefs: { type: OpportunitySearchCandidateRow["type"]; id: string }[] = [];
    const metricsByKey = new Map<
      string,
      { drivingDistanceMeters: number; drivingDurationSeconds: number; distanceMiles: number | null }
    >();

    for (const leg of legs) {
      const key = legKey(leg.opportunityType, leg.opportunityId);
      const c = candidateByKey.get(key);
      if (!c) continue;
      if (
        interestSlug &&
        !matchesInterestSubCategorySlug(c.interestTags, c.themeSlug, interestSlug)
      ) {
        continue;
      }

      if (!candidateMatchesFacilitySlugs(c, facilitySlugs)) {
        continue;
      }

      const distanceMiles =
        this.crowFlyMilesFromStrings(
          leg.parentLatitude,
          leg.parentLongitude,
          leg.opportunityLatitude,
          leg.opportunityLongitude,
        ) ?? this.crowFlyMiles(profileParentLat, profileParentLon, c);

      matchedRefs.push({ type: c.type, id: c.id });
      metricsByKey.set(key, {
        drivingDistanceMeters: leg.drivingDistanceMeters,
        drivingDurationSeconds: leg.drivingDurationSeconds,
        distanceMiles,
      });
    }

    matchedRefs.sort((a, b) => {
      const ma = metricsByKey.get(legKey(a.type, a.id))!;
      const mb = metricsByKey.get(legKey(b.type, b.id))!;
      if (ma.drivingDurationSeconds !== mb.drivingDurationSeconds) {
        return ma.drivingDurationSeconds - mb.drivingDurationSeconds;
      }
      return ma.drivingDistanceMeters - mb.drivingDistanceMeters;
    });

    if (matchedRefs.length === 0) return [];

    const payloadMap = await this.enrichRepo.getEnrichedOpportunityPayloadsForRecommendations(
      matchedRefs,
    );

    const out: OpportunitySearchResultItem[] = [];
    for (const ref of matchedRefs) {
      const key = legKey(ref.type, ref.id);
      const base = payloadMap.get(key);
      const m = metricsByKey.get(key);
      if (!base || !m) continue;
      out.push({
        ...base,
        distanceMiles: m.distanceMiles,
        drivingDistanceMiles: metersToMilesOneDecimal(m.drivingDistanceMeters),
        drivingDurationSeconds: m.drivingDurationSeconds,
      });
    }
    return out;
  }

  private crowFlyMilesFromStrings(
    parentLatStr: string,
    parentLonStr: string,
    oppLatStr: string,
    oppLonStr: string,
  ): number | null {
    const pLat = Number.parseFloat(parentLatStr);
    const pLon = Number.parseFloat(parentLonStr);
    const oLat = Number.parseFloat(oppLatStr);
    const oLon = Number.parseFloat(oppLonStr);
    if (
      !Number.isFinite(pLat) ||
      !Number.isFinite(pLon) ||
      !Number.isFinite(oLat) ||
      !Number.isFinite(oLon)
    ) {
      return null;
    }
    return Math.round(haversineDistanceMiles(pLat, pLon, oLat, oLon) * 10) / 10;
  }

  private crowFlyMiles(
    parentLat: number,
    parentLon: number,
    c: OpportunitySearchCandidateRow,
  ): number | null {
    const lat =
      c.latitude != null && c.latitude !== "" ? Number.parseFloat(c.latitude) : Number.NaN;
    const lon =
      c.longitude != null && c.longitude !== "" ? Number.parseFloat(c.longitude) : Number.NaN;
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
    return Math.round(haversineDistanceMiles(parentLat, parentLon, lat, lon) * 10) / 10;
  }
}
