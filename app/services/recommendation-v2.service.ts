import { AppError } from '../shared/errors/app-error';
import { AppClock } from '../shared/utils/app-clock';
import { RecommendationV2Repository } from '../repositories/recommendation-v2.repository';
import { DrivingLegService, buildRoutableLeg } from './driving-leg.service';
import { legKey } from '../repositories/driving-leg.repository';
import { OpportunityInteractionRepository, isSuppressed } from '../repositories/opportunity-interaction.repository';
import { opportunityRefKey } from '../shared/utils/opportunity-ref';
import * as ScoringV4 from './scoring-v4.service';
import type { NearbySource, RecommendationQueryDto, RecommendationSearchQueryDto, Score, RecommendationCandidateWithScore } from '../dtos/recommendation.dto';
import type { RecommendationV2Candidate } from '../dtos/recommendation.dto';
import type { Narrowed } from '../shared/types/assets.types';
import { AssetsService } from './assets.service';

const DEFAULT_LIMIT = 30;

/** opportunityTheme slug → interest category slugs (enums.json), built once per container. */
let _themeCategories: Map<string, string[]> | null = null;
function themeCategoryMap(): Map<string, string[]> {
  if (!_themeCategories) {
    _themeCategories = new Map(new AssetsService().getThemes().map((t) => [t.slug.toLowerCase(), t.interestId as string[]]));
  }
  return _themeCategories;
}

export class RecommendationV2Service {
  private readonly repo: RecommendationV2Repository;
  private readonly drivingLegs: DrivingLegService;
  private readonly interactions: OpportunityInteractionRepository;

  constructor() {
    this.repo = new RecommendationV2Repository();
    this.drivingLegs = new DrivingLegService();
    this.interactions = new OpportunityInteractionRepository();
  }

  /** `${type}#${id}` of every opportunity this parent marked "Not for us" within the last 90 days. */
  private async getSuppressedRefKeys(parentId: string): Promise<Set<string>> {
    const interactions = await this.interactions.listByParentId(parentId);
    return new Set(
      interactions.filter((i) => isSuppressed(i)).map((i) => opportunityRefKey(i.opportunityType, i.opportunityId)),
    );
  }

  /**
   * `parentOnly` (only used without a childId, e.g. Plan → parent tab): the list is for the parent
   * alone — age checks just the parent (an adult → Adults must be ticked), interest uses the parent's
   * picks only, no child tags, and pricing counts one adult. A parent with no children is allowed.
   * `priceAllMembers` (Plan → Everything Local): prices still count every family member, whoever
   * the scoring was for.
   */
  async getRecommendations2(
    dto: RecommendationQueryDto,
    skipRecommendations?: Score,
    opts: { parentOnly?: boolean; priceAllMembers?: boolean } = {},
  ) {
    const parentOnly = !!opts.parentOnly && !dto.childId;
    // priceAllMembers needs every member's age, so don't let the repo narrow to childId (done below anyway).
    const parent = await this.repo.getParentForRecommendations(dto.parentId, opts.priceAllMembers ? undefined : dto.childId);
    if (!parent) throw new AppError(404, 'Parent not found');

    // memberIds (Today → Works For Everyone after "Have We Got Everyone" → Apply): only the parent +
    // those profiles count — their common interests (guests' included) and every one of their ages.
    const memberIds = !dto.childId && dto.memberIds != null
      ? dto.memberIds.split(',').map((id) => id.trim()).filter(Boolean)
      : null;

    const narrowed = dto.childId
      ? { ...parent, children: parent.children.filter((c) => c.id === dto.childId) }
      : memberIds
        ? { ...parent, children: parent.children.filter((c) => memberIds.includes(c.id)) }
        : parent;

    // With memberIds, just the parent (nobody else ticked) is a valid selection.
    if (!parentOnly && !memberIds && !narrowed.children.length) {
      throw new AppError(400, 'No children found for this query. Add a child or remove childId filter.');
    }

    const parsedSearchRadius = dto.searchRadius ? Number(dto.searchRadius) : NaN;
    const maxMiles = Number.isFinite(parsedSearchRadius) ? parsedSearchRadius : narrowed.searchRadius;

    let narrowedParams: Narrowed = {
      ...narrowed,
      searchRadius: maxMiles
    }

    // childId: with one child selected, every step looks at that child only — the parent's interests
    // and age aren't considered (getItemsWithScoreV3 filters interestMembers/children by it).
    const scoredData = await this.getItemsWithScoreV3(narrowedParams, skipRecommendations, {
      childId: dto.childId,
      parentOnly,
      includeGuests: !!memberIds,
    });

    const childrenAges = opts.priceAllMembers
      ? parent.children.map((c) => ScoringV4.getAgeInYears(c.dateOfBirth))
      : scoredData.childrenAges;

    return { data: scoredData.data, childrenAges };
  }

  /**
   * "Nearby ideas" (1 mile around the opportunity being viewed). Who counts depends on `source`
   * (see NearbySource); without one, the old behaviour: the members in `childId` (comma list) or the
   * whole family, strict common-interest match.
   */
  async getNearby(dto: RecommendationQueryDto & { source?: NearbySource }, skipRecommendations?: Score) {
    const parent = await this.repo.getParentForRecommendations(dto.parentId);
    if (!parent) throw new AppError(404, 'Parent not found');

    const childIds = dto.childId?.split(',').map((id) => id.trim()).filter(Boolean);
    const onlyMembers = (ids: string[]) => ({ ...parent, children: parent.children.filter((c) => ids.includes(c.id)) });

    let narrowed: typeof parent = parent;
    let scope: { childId?: string; parentOnly?: boolean; interestMatch?: 'all' | 'any' | 'share'; includeGuests?: boolean; weatherRankOnly?: boolean } = {};
    switch (dto.source) {
      case 'today-everyone':
        // Parent + the "Have We Got Everyone" members (none sent → just the parent); any member's interest.
        narrowed = onlyMembers(childIds ?? []);
        scope = { interestMatch: 'any' };
        break;
      case 'today-member':
      case 'plan-member': {
        // One member only — their interests and age, the parent isn't counted. No member → the parent alone.
        const memberId = childIds?.[0];
        narrowed = memberId ? onlyMembers([memberId]) : parent;
        scope = memberId ? { childId: memberId } : { parentOnly: true };
        break;
      }
      case 'plan-all':
        // Everything within the radius — every step but distance is skipped by the caller (nothing is
        // dropped). Interest still ranks it: a theme any member picked counts, more members → higher.
        scope = { interestMatch: 'share' };
        break;
      default:
        narrowed = childIds?.length ? onlyMembers(childIds) : parent;
    }

    // if (!narrowed.children.length) {
    //   throw new AppError(400, 'No children found for this query.');
    // }

    let narrowedParams: Narrowed = {
      ...narrowed,
      searchRadius: 2, // use miles .....2 = 2miles
      opp: {
        lat: dto.opportunityLat || '0',
        long: dto.opportunityLong || '0',
      },
    }

    // Nearby counts guests' interests too (a guest is a real member of today's outing) — elsewhere
    // guests only count for age. Weather never hides a nearby place (Today → Works For Everyone /
    // With Someone In Mind): it's still scored, so weather-suited places come first.
    return this.getItemsWithScoreV3(narrowedParams, skipRecommendations, { ...scope, includeGuests: true, weatherRankOnly: true });
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

    return this.getItemsWithScoreV3(narrowedParams);
  }

  private parseCoords(c: RecommendationV2Candidate): { latitude: number; longitude: number } | null {
    const lat = c.latitude != null && c.latitude !== '' ? Number.parseFloat(c.latitude) : NaN;
    const lon = c.longitude != null && c.longitude !== '' ? Number.parseFloat(c.longitude) : NaN;
    return Number.isFinite(lat) && Number.isFinite(lon) ? { latitude: lat, longitude: lon } : null;
  }

  private sortScoreOf(row: { score: number | Partial<Score>; scoreBreakdown?: Record<string, number> }): number {
    const s: Record<string, unknown> =
      typeof row.score === 'object' && row.score !== null ? row.score : (row.scoreBreakdown ?? {});
    const n = (v: unknown) => Number(v) || 0;
    return n(s.weatherScore) + n(s.intrestScore ?? s.interestScore) + n(s.interestTagsScore ?? s.tagScore);
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
      score: number | Partial<Score>;
      scoreBreakdown?: Record<string, number>;
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
        sortScore: this.sortScoreOf(row),
        schedule: row.schedule,
      };
    });
  }

  async getItemsWithScoreV3(
    narrowed: Narrowed,
    skipRecommendations?: ScoringV4.ScoreV4,
    scope: { childId?: string; parentOnly?: boolean; interestMatch?: 'all' | 'any' | 'share'; includeGuests?: boolean; weatherRankOnly?: boolean } = {},
  ) {
    const { childId } = scope;
    const parentOnly = !!scope.parentOnly && !childId;
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

    const maxMiles = narrowed.searchRadius;
    // Members this request is for — parentOnly: nobody but the parent (no children/adults/guests).
    const children = parentOnly ? [] : childId ? narrowed.children.filter((c) => c.id === childId) : narrowed.children;
    const childAges = children.map((c) => ScoringV4.getAgeInYears(c.dateOfBirth));
    // Ages the age step checks — whole family: the parent (as an adult) + every member (children, adults,
    // guests); with a childId: just that child, the parent isn't checked; parentOnly: just the parent (18).
    const memberAges = ScoringV4.membersAgesOf(children, !childId);
    const childTagWeights = ScoringV4.buildChildTagWeights(children.map((ch) => ch.interestTags ?? []));




    // Step 1: interest match by SHARE of family members — each counted member (parent + children/adults
    // with interests, no guests) gets a level for this opportunity: category+theme 100 · theme 90 ·
    // variant 80 · category 70. Every opportunity any member matches is kept and scored by the members'
    // average level; only 10% or fewer members matching drops it. See ScoringV4.scoreInterestMatch.
    // V3 uses the strict ScoringV4.scoreCommonThemeMatch: 100 only when the opportunity's theme is one
    // EVERY counted member picked, otherwise 0 (dropped).
    // includeGuests (nearby only): guests with interests count like any other member.
    const interestAllMembers = ScoringV4.interestMembersOf(narrowed, { includeGuests: scope.includeGuests });
    const interestMembers = parentOnly
      ? interestAllMembers.filter((m) => m.id === narrowed.id)
      : childId
        ? interestAllMembers.filter((m) => m.id === childId)
        : interestAllMembers;
    // interestMatch 'any' (nearby from Today → Works For Everyone): a theme ANY counted member picked
    // is enough; default 'all': only themes every counted member picked.
    const commonThemes = scope.interestMatch === 'any'
      ? ScoringV4.anyThemesOf(interestMembers)
      : ScoringV4.commonThemesOf(interestMembers);
    const themeCategories = themeCategoryMap();

    const initialScores = {
      ...ScoringV4.getInitialScore({}), // all asigned to 0 consider for scoring
      ...(skipRecommendations && { ...skipRecommendations }) // asigned 100 to skip scoring
    }

    // Every recommendation/plan/search endpoint funnels through here, so this one filter hides a
    // "Not for us" opportunity (opportunity-interactions, not_interested) from all of them for 90 days.
    const [allCandidates, suppressed] = await Promise.all([
      this.repo.getOpportunityCandidatesV2(),
      this.getSuppressedRefKeys(narrowed.id),
    ]);
    const candidates = allCandidates.filter((c) => !suppressed.has(opportunityRefKey(c.type, c.id)));

    // A dimension pre-set to 100 (via skipRecommendations/initialScores) means
    // "don't score this — treat it as already maxed", so each step below must
    // leave it at 100 instead of recomputing and clobbering it with a real score.
    const scoreOrSkip = (current: number, compute: () => number): number =>
      current === 100 ? 100 : compute();

    // Interest and interest tags are the exception: they drive the final order, so they're ALWAYS
    // scored — a skip only turns off the interest filter (nothing is dropped), so e.g. Plan →
    // Everything Local still lists the opportunities matching the member's interests/tags first.
    const skipInterestFilter = initialScores.intrestScore === 100;

    const interestThemeScoreMatch: ScoringV4.CandidateWithScoreV4[] = candidates.map((c) => {
      const oppInterest = ScoringV4.opportunityInterestOf(c.themeSlug, c.themeVariantSlug, themeCategories);
      // 'share' (nearby from Plan → Everything Local): picked by any one member matches, picked by
      // more members scores higher; otherwise 100/0 against commonThemes ('all' or 'any').
      const intrestScore = scope.interestMatch === 'share'
        ? ScoringV4.scoreThemeShare(interestMembers, oppInterest)
        : ScoringV4.scoreCommonThemeMatch(interestMembers, oppInterest, commonThemes).score;

      return {
        ...c,
        score: {
          ...initialScores,
          intrestScore,
        },
      }
    }).filter((item) => skipInterestFilter || item.score.intrestScore !== 0);

    // Step 2: interest tags match — how many of the family's free-text interestTags show up on
    // each candidate's own tag list, weighted so a tag shared by 2 or more children scores
    // higher than one only 1 child picked.
    const interestTagsScoreMatch = interestThemeScoreMatch.map((item) => {
      // Always scored (see skipInterestFilter above) — tags never drop anything, they only rank.
      const interestTagsScore = ScoringV4.scoreInterestTagsWeighted(childTagWeights, item.tags);
      return {
        ...item,
        score: {
          ...item.score,
          interestTagsScore,
        },
      }
    });

    // Step 3: age match — everyone going must fit the candidate's ageBands, otherwise it's dropped. Adults
    // (parent included, whole-family only) need the Adults band ticked. See ScoringV4.scoreMembersAge.
    const ageScoreMatch = interestTagsScoreMatch.map((item) => {
      const ageScore = scoreOrSkip(item.score.ageScore, () => ScoringV4.scoreMembersAge(memberAges, item.ageBands));
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
          ScoringV4.scoreSchedule(c.type, c.startDate, c.endDate, c.activeDays, c.startTime, c.endTime)
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

    // Step 5: weather — rain/storm/snow hides outside opportunities (score 0 → dropped), keeps mixed
    // ones at a lower score and inside ones in full; good weather shows everything. One
    // weatherapi.com call per request (cached 10 minutes per postcode). See ScoringV4.scoreWeatherSuitability.
    // Weather pre-set to 100 (skipped) never reads the slugs, so don't call weatherapi.com for it.
    const liveWeatherSlugs = initialScores.weatherScore === 100
      ? []
      : await ScoringV4.getCachedWeatherSuitabilitySlugs(narrowed.postCode);

    const weatherScoreMatch = scheduleScoreMatch
      .map((item) => {
        const { physicalSetting } = item;
        const weatherScore = scoreOrSkip(item.score.weatherScore, () =>
          ScoringV4.scoreWeatherSuitability(liveWeatherSlugs, physicalSetting)
        );
        return { ...item, score: { ...item.score, weatherScore } };
      })
      // weatherRankOnly (nearby): scored for the order only — a bad-weather 0 doesn't drop it.
      .filter((item) => scope.weatherRankOnly || item.score.weatherScore !== 0);

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

    // Nearby mode (opportunity details → "Nearby ideas"): distance AND travel time are measured
    // from the opportunity being viewed, not the parent's home. Only places already within the
    // straight-line radius get routed (keeps routing calls tiny), and these opportunity →
    // opportunity legs bypass the per-parent home-leg cache so they never overwrite it.
    const isNearby = !!narrowed.opp;
    const drivingMap = isNearby
      ? await this.drivingLegs.computeLegsFrom(
        { lat, lon },
        routable.filter((leg) => ScoringV4.haversineDistanceMiles(lat, lon, leg.lat, leg.lon) <= maxMiles),
      )
      : await this.drivingLegs.ensureLegsCached(narrowed.id, routable);

    const distanceWithScoreMatch = weatherScoreMatch
      .map((item) => {
        const c = item;
        const coords = this.parseCoords(c);
        if (!coords) return null;

        const driving = drivingMap.get(legKey(c.type, c.id));
        // const distMiles = ScoringV4.haversineDistanceMiles(lat, lon, coords.latitude, coords.longitude);
        const distMilesRadius = ScoringV4.haversineDistanceMiles(lat, lon, coords.latitude, coords.longitude);
        const distMiles = driving ? ScoringV4.metersToMilesOneDecimal(driving.drivingDistanceMeters) : distMilesRadius;
        // Nearby: the radius is a straight-line "around this place" check — a short road detour
        // shouldn't drop a place that's genuinely next door.
        const scoreMiles = isNearby ? distMilesRadius : distMiles;
        const distanceScore = scoreOrSkip(item.score.distanceScore, () => ScoringV4.scoreDistance(scoreMiles, maxMiles));

        return {
          ...item,
          distanceMiles: Math.round(distMiles * 10) / 10,
          drivingDistanceMiles: driving ? ScoringV4.metersToMilesOneDecimal(driving.drivingDistanceMeters) : null,
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
        const rankScore = Number(score.intrestScore + score.interestTagsScore + score.weatherScore).toFixed(2);
        const { total, totalWeighted } = ScoringV4.combineWeighted(score);
        if (totalWeighted === 0) return null;

        return {
          ...c,
          score: { ...score, total: rankScore, totalWeighted },
          schedule: {
            startTime: c.startTime ?? null, endTime: c.endTime ?? null,
            startDate: c.startDate ?? null, endDate: c.endDate ?? null,
            weekDay: c.activeDays ?? null, currentTime: new Date().toISOString(),
            timeAndDate: AppClock.dateTimeString()
          },
        }
      }).filter((item): item is NonNullable<typeof item> => !!item);         // remove null items due to totalWeighted === 0

    // Final order: interest + interest tags + weather score only (highest first); equal scores are
    // shuffled fresh on every request. See ScoringV4.rankByInterestTagsAndWeather.
    const scoredShuffled = ScoringV4.rankByInterestTagsAndWeather(finalScoreMatch);

    const data = await this.attachPayloads(scoredShuffled)

    return { data, childrenAges: childAges };
  }
}
