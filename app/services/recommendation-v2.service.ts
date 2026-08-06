import { AppError } from '../shared/errors/app-error';
import { RecommendationV2Repository } from '../repositories/recommendation-v2.repository';
import { DrivingLegService, buildRoutableLeg } from './driving-leg.service';
import { legKey } from '../repositories/driving-leg.repository';
import {
  collectFamilyInterestSlugs,
  combineNearby,
  combineWeighted,
  getAgeInYears,
  haversineDistanceMiles,
  metersToMilesOneDecimal,
  scoreAge,
  scoreDistance,
  scoreInterestOverlap,
  scoreSchedule,
  scoreTagOverlap,
} from './scoring.service';
import type { RecommendationQueryDto } from '../dtos/recommendation.dto';
import type { RecommendationV2Candidate } from '../dtos/recommendation.dto';

const DEFAULT_LIMIT = 30;

export class RecommendationV2Service {
  private readonly repo: RecommendationV2Repository;
  private readonly drivingLegs: DrivingLegService;

  constructor() {
    this.repo        = new RecommendationV2Repository();
    this.drivingLegs = new DrivingLegService();
  }

  async getRecommendations(dto: RecommendationQueryDto) {
    const parent = await this.repo.getParentForRecommendations(dto.parentId, dto.childId);
    if (!parent) throw new AppError(404, 'Parent not found');

    const narrowed = dto.childId
      ? { ...parent, children: parent.children.filter((c) => c.id === dto.childId) }
      : parent;

    if (!narrowed.children.length) {
      throw new AppError(400, 'No children found for this query. Add a child or remove childId filter.');
    }

    const lat = Number.parseFloat(narrowed.latitude);
    const lon = Number.parseFloat(narrowed.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      throw new AppError(400, 'Parent location is invalid');
    }

    const childAges = narrowed.children.map((c) => getAgeInYears(c.dateOfBirth));
    const maxMiles  = narrowed.searchRadius;

    const familySlugs = collectFamilyInterestSlugs({
      parentCategorySlugs:    narrowed.interestCategories.map((x) => x.slug),
      parentSubCategorySlugs: narrowed.interestSubCategories.map((x) => x.slug),
      children: narrowed.children.map((ch) => ({
        interestCategorySlugs:    ch.interestCategories.map((x) => x.slug),
        interestSubCategorySlugs: ch.interestSubCategories.map((x) => x.slug),
      })),
    });

    // Free-text tags (e.g. "Cats", "Dogs") the selected children picked directly —
    // separate from the slug-based interest categories/sub-categories above.
    const childTags = [...new Set(narrowed.children.flatMap((ch) => ch.interestTags ?? []))];

    const candidates = await this.repo.getOpportunityCandidatesV2();
    const routable   = candidates
      .map((c) => {
        const coords = this.parseCoords(c);
        if (!coords) return null;
        return buildRoutableLeg(
          { postCode: narrowed.postCode, latitude: narrowed.latitude, longitude: narrowed.longitude },
          c.type, c.id, c.postcode, coords,
        );
      })
      .filter(Boolean) as ReturnType<typeof buildRoutableLeg>[];

    const drivingMap = await this.drivingLegs.ensureLegsCached(narrowed.id, routable);

    const scored = candidates
      .map((c) => {
        const coords = this.parseCoords(c);
        if (!coords) return null;

        const distMiles = haversineDistanceMiles(lat, lon, coords.latitude, coords.longitude);
        if (distMiles > maxMiles) return null;

        const interestScore  = Math.round(scoreInterestOverlap(familySlugs, c.themeSlug, c.themeVariantSlug));
        const ageScore       = Math.round(scoreAge(childAges, c.ageBands));
        const distanceScore  = Math.round(scoreDistance(distMiles, maxMiles));
        const tagScore       = Math.round(scoreTagOverlap(childTags, c.tags));
        const openingTimeScore  = scoreSchedule(c.type, c.startDate, c.endDate, c.activeDays, c.startTime, c.endTime); //openningScore
        if (openingTimeScore === 0) return null;
        const total          = combineWeighted(interestScore, ageScore, distanceScore);
        if (total === 0) return null;
        const adjusted       = Math.round(total * (openingTimeScore / 100));

        const driving = drivingMap.get(legKey(c.type, c.id));
        return {
          type: c.type, id: c.id, name: c.name, description: c.description,
          postcode: c.postcode,
          distanceMiles:          Math.round(distMiles * 10) / 10,
          drivingDistanceMiles:   driving ? metersToMilesOneDecimal(driving.drivingDistanceMeters)  : null,
          drivingDurationSeconds: driving?.drivingDurationSeconds ?? null,
          score: adjusted,
          tagScore,
          scoreBreakdown: { interestScore, ageScore, distanceScore, tagScore, openingTimeScore, total: adjusted },
          // Exactly what fed openingTimeScore/scoreSchedule — carried through
          // to the response so clients can see why a schedule score landed
          // where it did, not just the resulting number.
          schedule: { startTime: c.startTime ?? null, endTime: c.endTime ?? null, startDate: c.startDate ?? null, endDate: c.endDate ?? null, weekDay: c.activeDays ?? null, currentTime: new Date().toISOString() },
        };
      })
      .filter(Boolean)
      // tagScore only breaks ties within the same recommendation score — it
      // never outranks a candidate with a higher base score.
      .sort((a, b) => b!.score - a!.score || b!.tagScore - a!.tagScore) as NonNullable<ReturnType<typeof this.scoreOne>>[];
      // .slice(0, DEFAULT_LIMIT) as NonNullable<ReturnType<typeof this.scoreOne>>[];

    const data = await this.attachPayloads(scored);
    return { data, childrenAges: childAges };
  }

  async getNearby(dto: RecommendationQueryDto) {
    const parent = await this.repo.getParentForRecommendations(dto.parentId, dto.childId);
    if (!parent) throw new AppError(404, 'Parent not found');

    const narrowed = dto.childId
      ? { ...parent, children: parent.children.filter((c) => c.id === dto.childId) }
      : parent;

    if (!narrowed.children.length) {
      throw new AppError(400, 'No children found for this query.');
    }

    // const lat       = Number.parseFloat(narrowed.latitude);
    // const lon       = Number.parseFloat(narrowed.longitude);
    const oppLat       = Number.parseFloat(dto.opportunityLat || '0');
    const oppLong       = Number.parseFloat(dto.opportunityLong || '0');
    const childAges = narrowed.children.map((c) => getAgeInYears(c.dateOfBirth));
    // const maxMiles  = narrowed.searchRadius;
    const maxMiles  = 1;

    const candidates = await this.repo.getOpportunityCandidatesV2();
    const routable   = candidates
      .map((c) => {
        const coords = this.parseCoords(c);
        if (!coords) return null;
        return buildRoutableLeg(
          { postCode: narrowed.postCode, latitude: narrowed.latitude, longitude: narrowed.longitude },
          c.type, c.id, c.postcode, coords,
        );
      })
      .filter(Boolean) as ReturnType<typeof buildRoutableLeg>[];

    const drivingMap = await this.drivingLegs.ensureLegsCached(narrowed.id, routable);

    const scored = candidates
      .map((c) => {
        const coords = this.parseCoords(c);
        if (!coords) return null;
        const distMiles    = haversineDistanceMiles(oppLat, oppLong, coords.latitude, coords.longitude);
        if (distMiles > maxMiles) return null;
        const ageScore      = Math.round(scoreAge(childAges, c.ageBands));
        const distScore     = Math.round(scoreDistance(distMiles, maxMiles));
        const scheduleScore = scoreSchedule(c.type, c.startDate, c.endDate, c.activeDays, c.startTime, c.endTime);
        if (scheduleScore === 0) return null;
        const total         = combineNearby(ageScore, distScore);
        if (total === 0) return null;
        const adjusted      = Math.round(total * (scheduleScore / 100));
        const driving       = drivingMap.get(legKey(c.type, c.id));
        return {
          type: c.type, id: c.id, name: c.name, description: c.description,
          postcode: c.postcode,
          distanceMiles:          Math.round(distMiles * 10) / 10,
          drivingDistanceMiles:   driving ? metersToMilesOneDecimal(driving.drivingDistanceMeters)  : null,
          drivingDurationSeconds: driving?.drivingDurationSeconds ?? null,
          score: adjusted,
          scoreBreakdown: { interestScore: 0, ageScore, distanceScore: distScore, scheduleScore, total: adjusted },
          schedule: { startTime: c.startTime ?? null, endTime: c.endTime ?? null, startDate: c.startDate ?? null, endDate: c.endDate ?? null, weekDay: c.activeDays ?? null, currentTime: new Date().toISOString() },
        };
      })
      .filter(Boolean)
      .sort((a, b) => b!.score - a!.score)
      .slice(0, DEFAULT_LIMIT) as NonNullable<ReturnType<typeof this.scoreOne>>[];

    const data = await this.attachPayloads(scored);
    return { data, childrenAges: childAges };
  }

  private parseCoords(c: RecommendationV2Candidate): { latitude: number; longitude: number } | null {
    const lat = c.latitude  != null && c.latitude  !== '' ? Number.parseFloat(c.latitude)  : NaN;
    const lon = c.longitude != null && c.longitude !== '' ? Number.parseFloat(c.longitude) : NaN;
    return Number.isFinite(lat) && Number.isFinite(lon) ? { latitude: lat, longitude: lon } : null;
  }

  // Dummy overload for type inference only
  private scoreOne(_c: RecommendationV2Candidate, _lat: number, _lon: number, _maxMiles: number): object | null {
    return null;
  }

  private async attachPayloads(scored: object[]) {
    if (scored.length === 0) return [];
    const refs = (scored as { type: string; id: string }[]).map((r) => ({
      type: r.type as 'venue' | 'event' | 'club' | 'route',
      id: r.id,
    }));
    const payloadMap = await this.repo.getEnrichedPayloads(refs);

    return (scored as {
      type: string; id: string;
      distanceMiles: number;
      drivingDistanceMiles: number | null;
      drivingDurationSeconds: number | null;
      score: number;
      scoreBreakdown: object;
      schedule: { startTime: string | null; endTime: string | null; startDate: string | null; endDate: string | null; weekDay: string[] | null; currentTime: string };
    }[]).map((row) => {
      const payload = payloadMap.get(legKey(row.type as 'venue' | 'event' | 'club' | 'route', row.id));
      if (!payload) throw new AppError(500, `Payload missing for ${row.type} ${row.id}`);
      return {
        ...payload,
        distanceMiles:          row.distanceMiles,
        drivingDistanceMiles:   row.drivingDistanceMiles,
        drivingDurationSeconds: row.drivingDurationSeconds,
        score:                  row.score,
        scoreBreakdown:         row.scoreBreakdown,
        schedule:               row.schedule,
      };
    });
  }
}
