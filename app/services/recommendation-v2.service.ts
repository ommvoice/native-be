import { AppError } from '../shared/errors/app-error';
import { AppClock } from '../shared/utils/app-clock';
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
  rankWithShuffle,
  scoreAge,
  scoreDistance,
  scoreInterestOverlap,
  scoreSchedule,
  scoreTagOverlap,
} from './scoring.service';
import {
  buildFamilyThemeSlugWeights,
  scoreInterestThemeWeighted,
  buildChildTagWeights,
  scoreInterestTagsWeighted,
  scoreAge as scoreAgeV2,
  scoreSchedule as scoreScheduleV2,
  getCachedWeatherSuitabilitySlugs,
  scoreWeatherSuitability,
  scoreDistance as scoreDistanceV2,
  combineWeighted as combineWeightedV2,
  rankWithShuffle as rankWithShuffleV2,
  getInitialScore
} from './scoring-v2.service';
import type { RecommendationQueryDto, RecommendationSearchQueryDto, Score, RecommendationCandidateWithScore } from '../dtos/recommendation.dto';
import type { RecommendationV2Candidate } from '../dtos/recommendation.dto';
import type { Narrowed } from '../shared/types/assets.types';

const DEFAULT_LIMIT = 30;

export class RecommendationV2Service {
  private readonly repo: RecommendationV2Repository;
  private readonly drivingLegs: DrivingLegService;

  constructor() {
    this.repo = new RecommendationV2Repository();
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
    // Per-request override (e.g. a filter-sheet radius) wins when present and
    // valid; a missing/malformed searchRadius param falls back to the
    // parent's persisted radius rather than silently going unbounded.
    const parsedSearchRadius = dto.searchRadius ? Number(dto.searchRadius) : NaN;
    const maxMiles = Number.isFinite(parsedSearchRadius) ? parsedSearchRadius : narrowed.searchRadius;

    const familySlugs = collectFamilyInterestSlugs({
      parentCategorySlugs: narrowed.interestCategories.map((x) => x.slug),
      parentSubCategorySlugs: narrowed.interestSubCategories.map((x) => x.slug),
      children: narrowed.children.map((ch) => ({
        interestCategorySlugs: ch.interestCategories.map((x) => x.slug),
        interestSubCategorySlugs: ch.interestSubCategories.map((x) => x.slug),
      })),
    });

    // Free-text tags (e.g. "Cats", "Dogs") the selected children picked directly —
    // separate from the slug-based interest categories/sub-categories above.
    const childTags = [...new Set(narrowed.children.flatMap((ch) => ch.interestTags ?? []))];

    const candidates = await this.repo.getOpportunityCandidatesV2();
    const routable = candidates
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

        const interestScore = Math.round(scoreInterestOverlap(familySlugs, c.themeSlug, c.themeVariantSlug));
        const ageScore = Math.round(scoreAge(childAges, c.ageBands));
        const distanceScore = Math.round(scoreDistance(distMiles, maxMiles));
        const tagScore = Math.round(scoreTagOverlap(childTags, c.tags));
        const openingTimeScore = scoreSchedule(c.type, c.startDate, c.endDate, c.activeDays, c.startTime, c.endTime); //openningScore
        if (openingTimeScore === 0) return null;
        const total = combineWeighted(interestScore, ageScore, distanceScore);
        if (total === 0) return null;
        const adjusted = Math.round(total * (openingTimeScore / 100));

        const driving = drivingMap.get(legKey(c.type, c.id));
        return {
          type: c.type, id: c.id, name: c.name, description: c.description,
          postcode: c.postcode,
          distanceMiles: Math.round(distMiles * 10) / 10,
          drivingDistanceMiles: driving ? metersToMilesOneDecimal(driving.drivingDistanceMeters) : null,
          drivingDurationSeconds: driving?.drivingDurationSeconds ?? null,
          score: adjusted,
          tagScore,
          scoreBreakdown: { interestScore, ageScore, distanceScore, tagScore, openingTimeScore, total: adjusted },
          // Exactly what fed openingTimeScore/scoreSchedule — carried through
          // to the response so clients can see why a schedule score landed
          // where it did, not just the resulting number.
          schedule: { startTime: c.startTime ?? null, endTime: c.endTime ?? null, startDate: c.startDate ?? null, endDate: c.endDate ?? null, weekDay: c.activeDays ?? null, currentTime: new Date().toISOString(), timeAndDate: AppClock.dateTimeString() },
        };
      })
      .filter(Boolean)
      // tagScore only breaks ties within the same recommendation score — it
      // never outranks a candidate with a higher base score.
      .sort((a, b) => b!.score - a!.score)// as NonNullable<ReturnType<typeof this.scoreOne>>[]
      .sort((a, b) => b!.tagScore - a!.tagScore) as NonNullable<ReturnType<typeof this.scoreOne>>[];
    //.sort((a, b) => b!.score - a!.score || b!.tagScore - a!.tagScore) as NonNullable<ReturnType<typeof this.scoreOne>>[];


    // .slice(0, DEFAULT_LIMIT) as NonNullable<ReturnType<typeof this.scoreOne>>[];

    // Shuffle candidates that tie on both score and tagScore, so repeat requests don't always
    // return the exact same order within a tier; higher-scored candidates still always float to the top.
    const scoredShuffled = rankWithShuffle(scored as unknown as { score: number; tagScore: number }[]);

    const data = await this.attachPayloads(scoredShuffled);
    return { data, childrenAges: childAges };
  }

  async getRecommendations2(dto: RecommendationQueryDto , skipRecommendations?:Score) {
    const parent = await this.repo.getParentForRecommendations(dto.parentId, dto.childId);
    if (!parent) throw new AppError(404, 'Parent not found');

    const narrowed = dto.childId
      ? { ...parent, children: parent.children.filter((c) => c.id === dto.childId) }
      : parent;

    if (!narrowed.children.length) {
      throw new AppError(400, 'No children found for this query. Add a child or remove childId filter.');
    }

    const parsedSearchRadius = dto.searchRadius ? Number(dto.searchRadius) : NaN;
    const maxMiles = Number.isFinite(parsedSearchRadius) ? parsedSearchRadius : narrowed.searchRadius;

    let narrowedParams: Narrowed = {
      ...narrowed,
      searchRadius: maxMiles
    }

    const scoredData = await this.getItemsWithScore(narrowedParams, skipRecommendations);

    return { data: scoredData.data, childrenAges: scoredData.childrenAges };
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
    const oppLat = Number.parseFloat(dto.opportunityLat || '0');
    const oppLong = Number.parseFloat(dto.opportunityLong || '0');
    const childAges = narrowed.children.map((c) => getAgeInYears(c.dateOfBirth));
    // const maxMiles  = narrowed.searchRadius;
    const maxMiles = 1;

    const candidates = await this.repo.getOpportunityCandidatesV2();
    const routable = candidates
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
        const distMiles = haversineDistanceMiles(oppLat, oppLong, coords.latitude, coords.longitude);
        if (distMiles > maxMiles) return null;
        const ageScore = Math.round(scoreAge(childAges, c.ageBands));
        const distScore = Math.round(scoreDistance(distMiles, maxMiles));
        const scheduleScore = scoreSchedule(c.type, c.startDate, c.endDate, c.activeDays, c.startTime, c.endTime);
        if (scheduleScore === 0) return null;
        const total = combineNearby(ageScore, distScore);
        if (total === 0) return null;
        const adjusted = Math.round(total * (scheduleScore / 100));
        const driving = drivingMap.get(legKey(c.type, c.id));
        return {
          type: c.type, id: c.id, name: c.name, description: c.description,
          postcode: c.postcode,
          distanceMiles: Math.round(distMiles * 10) / 10,
          drivingDistanceMiles: driving ? metersToMilesOneDecimal(driving.drivingDistanceMeters) : null,
          drivingDurationSeconds: driving?.drivingDurationSeconds ?? null,
          score: adjusted,
          scoreBreakdown: { interestScore: 0, ageScore, distanceScore: distScore, scheduleScore, total: adjusted },
          schedule: { startTime: c.startTime ?? null, endTime: c.endTime ?? null, startDate: c.startDate ?? null, endDate: c.endDate ?? null, weekDay: c.activeDays ?? null, currentTime: new Date().toISOString(), timeAndDate: AppClock.dateTimeString() },
        };
      })
      .filter(Boolean)
      .sort((a, b) => b!.score - a!.score)
      .slice(0, DEFAULT_LIMIT) as NonNullable<ReturnType<typeof this.scoreOne>>[];

    const data = await this.attachPayloads(scored);
    return { data, childrenAges: childAges };
  }

  async getNearby2(dto: RecommendationQueryDto, skipRecommendations?:Score) {
    const parent = await this.repo.getParentForRecommendations(dto.parentId, dto.childId);
    if (!parent) throw new AppError(404, 'Parent not found');

    const narrowed = dto.childId
      ? { ...parent, children: parent.children.filter((c) => c.id === dto.childId) }
      : parent;

    if (!narrowed.children.length) {
      throw new AppError(400, 'No children found for this query.');
    }

    let narrowedParams: Narrowed = {
      ...narrowed,
      searchRadius: 1, // use miles .....1 = 1miles
      opp: {
        lat: dto.opportunityLat || '0',
        long: dto.opportunityLong || '0',
      },
    }

    return this.getItemsWithScore(narrowedParams, skipRecommendations);
  }

  async getSearchRecommendations(dto: RecommendationSearchQueryDto) {
    const parent = await this.repo.getParentForRecommendations(dto.parentId, dto.childId);
    if (!parent) throw new AppError(404, 'Parent not found');

    const narrowed = dto.childId
      ? { ...parent, children: parent.children.filter((c) => c.id === dto.childId) }
      : parent;

    if (!narrowed.children.length) {
      throw new AppError(400, 'No children found for this query. Add a child or remove childId filter.');
    }

    let narrowedParams: Narrowed = {
      ...narrowed,
      ...(dto.searchRadius && { searchRadius: Number(dto.searchRadius) })
    }

    return this.getItemsWithScore(narrowedParams);
  }

  private parseCoords(c: RecommendationV2Candidate): { latitude: number; longitude: number } | null {
    const lat = c.latitude != null && c.latitude !== '' ? Number.parseFloat(c.latitude) : NaN;
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
      schedule: { startTime: string | null; endTime: string | null; startDate: string | null; endDate: string | null; weekDay: string[] | null; currentTime: string; timeAndDate: string };
    }[]).map((row) => {
      const payload = payloadMap.get(legKey(row.type as 'venue' | 'event' | 'club' | 'route', row.id));
      if (!payload) throw new AppError(500, `Payload missing for ${row.type} ${row.id}`);
      return {
        ...payload,
        distanceMiles: row.distanceMiles,
        drivingDistanceMiles: row.drivingDistanceMiles,
        drivingDurationSeconds: row.drivingDurationSeconds,
        score: row.score,
        scoreBreakdown: row.scoreBreakdown,
        schedule: row.schedule,
      };
    });
  }

  async getItemsWithScore(narrowed: Narrowed, skipRecommendations?: Score) {
    // console.log("NarrowedData : ",JSON.stringify(narrowed));

    let lat = Number.parseFloat(narrowed.latitude);
    let lon = Number.parseFloat(narrowed.longitude);

    if (narrowed.opp) {
      lat = Number.parseFloat(narrowed.opp.lat)
      lon = Number.parseFloat(narrowed.opp.long);
    }

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      throw new AppError(400, 'Location is invalid');
    }

    const childAges = narrowed.children.map((c) => getAgeInYears(c.dateOfBirth));
    const maxMiles = narrowed.searchRadius;
    const candidates = await this.repo.getOpportunityCandidatesV2();
    // Free-text tags (e.g. "Cats", "Dogs") the selected children picked directly —
    // separate from the slug-based interest categories/sub-categories above. Weighted so a tag
    // 2 or more children picked scores higher than one only 1 child picked.
    const childTagWeights = buildChildTagWeights(narrowed.children.map((ch) => ch.interestTags ?? []));

    // Step 1: interest theme match — narrowed.interestSubCategories are the family's theme
    // slugs; score every candidate by how much its themeSlug/themeVariantSlug overlaps them,
    // weighted so a theme shared by the parent + 1 or 2 children scores higher than one only a
    // single family member picked. 
    const familyThemeSlugWeights = buildFamilyThemeSlugWeights({
      parentSlugs: narrowed.interestSubCategories.map((x) => x.slug),
      childrenSlugs: narrowed.children.map((ch) => ch.interestSubCategories.map((x) => x.slug)),
    });

    const initialScores = {
      ...getInitialScore({}), // all asigned to 0 consider for scoring
      ...(skipRecommendations && {...skipRecommendations}) // asigned 100 to skip scoring
    }

    // A dimension pre-set to 100 (via skipRecommendations/initialScores) means
    // "don't score this — treat it as already maxed", so each step below must
    // leave it at 100 instead of recomputing and clobbering it with a real score.
    const scoreOrSkip = (current: number, compute: () => number): number =>
      current === 100 ? 100 : compute();

    const interestThemeScoreMatch: RecommendationCandidateWithScore[] = candidates.map((c) => {
      const intrestScore = scoreOrSkip(initialScores.intrestScore, () =>
        scoreInterestThemeWeighted(familyThemeSlugWeights, c.themeSlug, c.themeVariantSlug)
      );
      return {
        ...c,
        score: {
          ...initialScores,
          intrestScore,
        },
      }
    }).filter((item) => item.score.intrestScore !== 0);

    // Step 2: interest tags match — how many of the family's free-text interestTags show up on
    // each candidate's own tag list, weighted so a tag shared by 2 or more children scores
    // higher than one only 1 child picked.
    const interestTagsScoreMatch = interestThemeScoreMatch.map((item) => {
      const interestTagsScore = scoreOrSkip(item.score.interestTagsScore, () =>
        scoreInterestTagsWeighted(childTagWeights, item.tags)
      );
      return {
        ...item,
        score: {
          ...item.score,
          interestTagsScore,
        },
      }
    }).filter((item) => item.score.intrestScore !== 0); // will never be 0 as we are send 50

    // Step 3: age match — how well each candidate's ageBands suit the family's children's ages.
    const ageScoreMatch = interestTagsScoreMatch.map((item) => {
      const ageScore = scoreOrSkip(item.score.ageScore, () => scoreAgeV2(childAges, item.ageBands));
      return {
        ...item,
        score: {
          ...item.score,
          ageScore,
        },
      }
    }).filter((item) => item.score.ageScore !== 0);

    // Step 4: schedule match — how well each candidate's opening hours / session times line up
    // with right now (the "1 hr rule": imminent or currently-open scores higher than closed).
    // scheduleScore === 0 means closed/not-on-today/no-schedule-info — drop it.
    const scheduleScoreMatch = ageScoreMatch
      .map((item) => {
        const c = item;
        const scheduleScore = scoreOrSkip(item.score.scheduleScore, () =>
          scoreScheduleV2(c.type, c.startDate, c.endDate, c.activeDays, c.startTime, c.endTime)
        );
        return {
          ...item,
          score: {
            ...item.score,
            scheduleScore,
          },
        }
      })
      .filter((item) => item.score.scheduleScore !== 0)

    // Step 5: weather match — "outside" candidates are excluded (weatherScore null) unless the
    // live weather is actually one of their listed suitable conditions; "inside"/"mixed_covering"
    // candidates are weather-immune and always score well. One weatherapi.com call per request
    // (cached 10 minutes per postcode), not one per candidate.
    const liveWeatherSlugs = await getCachedWeatherSuitabilitySlugs(narrowed.postCode);

    const weatherScoreMatch = scheduleScoreMatch
      .map((item) => {
        const { physicalSetting, weatherSuitability } = item;
        const weatherScore = scoreOrSkip(item.score.weatherScore, () =>
          scoreWeatherSuitability(liveWeatherSlugs, physicalSetting, weatherSuitability)
        );
        return { ...item, score: { ...item.score, weatherScore } };
      })
      .filter((item) => item.score.weatherScore !== 0);

    // Step 6: distance match 
    const routable = weatherScoreMatch
      .map((item) => {
        const c = item;
        const coords = this.parseCoords(c);
        if (!coords) return null;
        return buildRoutableLeg(
          { postCode: narrowed.postCode, latitude: narrowed.latitude, longitude: narrowed.longitude },
          c.type, c.id, c.postcode, coords,
        );
      })
      .filter(Boolean) as ReturnType<typeof buildRoutableLeg>[];

    const drivingMap = await this.drivingLegs.ensureLegsCached(narrowed.id, routable);

    const distanceWithScoreMatch = weatherScoreMatch
      .map((item) => {
        const c = item;
        const coords = this.parseCoords(c);
        if (!coords) return null;

        const distMiles = haversineDistanceMiles(lat, lon, coords.latitude, coords.longitude);
        const driving = drivingMap.get(legKey(c.type, c.id));
        const distanceScore = scoreOrSkip(item.score.distanceScore, () => scoreDistanceV2(distMiles, maxMiles));

        return {
          ...item,
          distanceMiles: Math.round(distMiles * 10) / 10,
          drivingDistanceMiles: driving ? metersToMilesOneDecimal(driving.drivingDistanceMeters) : null,
          drivingDurationSeconds: driving?.drivingDurationSeconds ?? null,
          score: { ...item.score, distanceScore }
        };
      })
      .filter(
        (item): item is NonNullable<typeof item> =>
          item !== null && item.score.distanceScore !== 0
      );

    const finalScoreMatch = distanceWithScoreMatch
      .map((c) => {
        const score = c.score;
        const { total, totalWeighted } = combineWeightedV2(score);
        if (totalWeighted === 0) return null;

        return {
          ...c,
          score: { ...score, total, totalWeighted },
          schedule: {
            startTime: c.startTime ?? null, endTime: c.endTime ?? null,
            startDate: c.startDate ?? null, endDate: c.endDate ?? null,
            weekDay: c.activeDays ?? null, currentTime: new Date().toISOString(),
            timeAndDate: AppClock.dateTimeString()
          },
        }
      }).filter((item): item is NonNullable<typeof item> => !!item)         // remove null items due to totalWeighted === 0
      .sort((a, b) => b!.score.totalWeighted - a!.score.totalWeighted)
      .sort((a, b) => b!.score.interestTagsScore - a!.score.interestTagsScore) as NonNullable<ReturnType<typeof this.scoreOne>>[];


    const scoredShuffled = rankWithShuffleV2(finalScoreMatch as unknown as { score: { total: number, totalWeighted: number, interestTagsScore: number } }[]);

    //-----------
    // return scoredShuffled.splice(0, 3)
    const data = await this.attachPayloads(scoredShuffled)

    return { data, childrenAges: childAges };
  }
}
