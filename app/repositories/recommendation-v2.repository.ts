import { GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import db from '../shared/db/dynamo-client';
import { TABLES } from '../shared/db/tables';
import { AssetsService } from '../services/assets.service';
import type { RecommendationV2Candidate } from '../dtos/recommendation.dto';
import type { OpportunityRecordType } from './driving-leg.repository';
import { legKey } from './driving-leg.repository';
import { AppClock } from '../shared/utils/app-clock';

function b(v: unknown): boolean | null {
  return typeof v === 'boolean' ? v : null;
}

/** venue/event/club/routeInterestTags are a comma-separated free-text list, e.g. "birdsong, viewpoints, cycling". */
function splitTags(raw: unknown): string[] {
  if (typeof raw !== 'string' || !raw.trim()) return [];
  return raw.split(',').map((t) => t.trim()).filter(Boolean);
}

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
function capitalize(s: string): string { return s.charAt(0).toUpperCase() + s.slice(1); }

/** Today's scheduled start/end time-of-day for an event, e.g. { startTime: "14:00", endTime: "16:00" }. */
function getEventTodayTimes(e: Record<string, unknown>): { startTime: string | null; endTime: string | null } {
  if (e.eventDailyFixedTimings === true) {
    return {
      startTime: (e.eventDailyFixedStartTime as string | null) ?? null,
      endTime:   (e.eventDailyFixedEndTime   as string | null) ?? null,
    };
  }
  const day = DAY_NAMES[AppClock.weekday()]!;
  return {
    startTime: (e[`eventMixedTimings${capitalize(day)}Start`] as string | null) ?? null,
    endTime:   (e[`eventMixedTimings${capitalize(day)}End`]   as string | null) ?? null,
  };
}

/** Today's scheduled start/end time-of-day for a club, e.g. { startTime: "16:30", endTime: "17:30" }. */
function getClubTodayTimes(c: Record<string, unknown>): { startTime: string | null; endTime: string | null } {
  if (c.clubFixedDailyTimings === true) {
    return {
      startTime: (c.clubDailyStartTime as string | null) ?? null,
      endTime:   (c.clubDailyEndTime   as string | null) ?? null,
    };
  }
  const day = DAY_NAMES[AppClock.weekday()]!;
  return {
    startTime: (c[`clubMixedTimings${capitalize(day)}StartTime`] as string | null) ?? null,
    endTime:   (c[`clubMixedTimings${capitalize(day)}EndTime`]   as string | null) ?? null,
  };
}

function getClubActiveDays(c: Record<string, unknown>): string[] {
  if (c.clubFixedDailyTimings === true && c.clubDailySchedule) {
    return (c.clubDailySchedule as string)
      .split(',')
      .map((d) => d.trim().toLowerCase())
      .filter(Boolean);
  }
  const days: string[] = [];
  if (c.clubMixedTimingsMondayStartTime)    days.push('monday');
  if (c.clubMixedTimingsTuesdayStartTime)   days.push('tuesday');
  if (c.clubMixedTimingsWednesdayStartTime) days.push('wednesday');
  if (c.clubMixedTimingsThursdayStartTime)  days.push('thursday');
  if (c.clubMixedTimingsFridayStartTime)    days.push('friday');
  if (c.clubMixedTimingsSaturdayStartTime)  days.push('saturday');
  if (c.clubMixedTimingsSundayStartTime)    days.push('sunday');
  return days;
}

export class RecommendationV2Repository {
  private readonly assets = new AssetsService();

  async getParentForRecommendations(parentId: string, childId?: string,  opportunityLat?: string, opportunityLong?: string) {
    const res = await db.send(new GetCommand({ TableName: TABLES.parents, Key: { id: parentId } }));
    if (!res.Item) return null;
    const item = res.Item as Record<string, unknown>;

    // Parent.interestCategoryIds/interestSubCategoryIds now store asset slugs
    // directly (not DynamoDB ids), so no lookup against any table/asset is needed.
    const categorySlugs    = (item.interestCategoryIds    as string[]) ?? [];
    const subCategorySlugs = (item.interestSubCategoryIds as string[]) ?? [];

    const children = await this.getChildrenForParent(parentId, childId);

    return {
      id:                     item.id as string,
      postCode:               item.postCode as string,
      latitude:               item.latitude as string,
      longitude:              item.longitude as string,
      searchRadius:           item.searchRadius as number,
      interestCategories:     categorySlugs.map((slug) => ({ slug })),
      interestSubCategories:  subCategorySlugs.map((slug) => ({ slug })),
      children,
    };
  }

  private async getChildrenForParent(parentId: string, childId?: string) {
    const res = await db.send(
      new QueryCommand({
        TableName: TABLES.children,
        IndexName: 'parentId-index',
        KeyConditionExpression: 'parentId = :pid',
        ExpressionAttributeValues: { ':pid': parentId },
      }),
    );
    const items    = (res.Items ?? []) as Record<string, unknown>[];
    const filtered = childId ? items.filter((i) => i.id === childId) : items;

    // Child.interestCategoryIds/interestSubCategoryIds/skillIds now store asset
    // slugs directly — build the response shape from the stored slugs, no lookup needed.
    return filtered.map((item) => {
      const categorySlugs    = (item.interestCategoryIds    as string[]) ?? [];
      const subCategorySlugs = (item.interestSubCategoryIds as string[]) ?? [];
      const skillSlugs       = (item.skillIds               as string[]) ?? [];

      return {
        id:                    item.id as string,
        dateOfBirth:           new Date(item.dateOfBirth as string),
        interestCategories:    categorySlugs.map((slug) => ({ slug })),
        interestSubCategories: subCategorySlugs.map((slug) => ({ slug })),
        // Free-text tags (e.g. "Cats", "Dogs") — separate from the
        // slug-based interestCategoryIds/interestSubCategoryIds above.
        interestTags: (item.interestTags as string[]) ?? [],
        skills: skillSlugs.map((slug) => ({
          slug,
          minAge: null,
          maxAge: null,
          subCategory: null,
        })),
      };
    });
  }

  async getOpportunityCandidatesV2(): Promise<RecommendationV2Candidate[]> {
    const venues = this.assets.getAllVenues() as unknown as Record<string, unknown>[];
    const events = this.assets.getAllEvents() as unknown as Record<string, unknown>[];
    const clubs  = this.assets.getAllClubs()  as unknown as Record<string, unknown>[];
    const routes = this.assets.getAllRoutes() as unknown as Record<string, unknown>[];

    const venueRows: RecommendationV2Candidate[] = venues.map((v) => ({
      type: 'venue' as const,
      id:              v.id as string,
      name:            (v.venueName         as string) ?? '',
      description:     (v.venueDescription  as string | null) ?? null,
      postcode:        (v.venuePostcode      as string | null) ?? null,
      latitude:        (v.latitude          as string | null) ?? null,
      longitude:       (v.longitude         as string | null) ?? null,
      themeSlug:       (v.themeSlug         as string) ?? '',
      themeVariantSlug:(v.themeVariantSlug   as string) ?? '',
      ageBands: {
        under1:   b(v.venueAgeSuitabilityUnder1Years),
        ages1To2: b(v.venueAgeSuitability1To2Years),
        ages3To4: b(v.venueAgeSuitability3To4Years),
        ages5To7: b(v.venueAgeSuitability5To7Years),
        ages8To12:b(v.venueAgeSuitability8To12Years),
        over13:   b(v.venueAgeSuitabilityOver13Years),
        adults:   b(v.venueAgeSuitabilityAdults),
      },
      skillAreaSlug:    null,
      skillAreaVariant: null,
      tags:             splitTags(v.venueInterestTags),
    }));

    const eventRows: RecommendationV2Candidate[] = events.map((e) => ({
      type: 'event' as const,
      id:              e.id as string,
      name:            (e.eventName         as string) ?? '',
      description:     (e.eventDescription  as string | null) ?? null,
      postcode:        (e.eventPostcode      as string | null) ?? null,
      latitude:        (e.latitude          as string | null) ?? null,
      longitude:       (e.longitude         as string | null) ?? null,
      themeSlug:       (e.themeSlug         as string) ?? '',
      themeVariantSlug:(e.themeVariantSlug   as string) ?? '',
      ageBands: {
        under1:   b(e.eventAgeSuitabilityUnder1S),
        ages1To2: b(e.eventAgeSuitability1To2Years),
        ages3To4: b(e.eventAgeSuitability3To4Years),
        ages5To7: b(e.eventAgeSuitability5To7Years),
        ages8To12:b(e.eventAgeSuitability8To12Years),
        over13:   b(e.eventAgeSuitabilityOver13Years),
        adults:   b(e.eventAgeSuitabilityAdults),
      },
      skillAreaSlug:    (e.eventSkillArea         as string | null) ?? null,
      skillAreaVariant: (e.eventSkillAreaVariant   as string | null) ?? null,
      startDate:        (e.eventStartDate as string | null) ?? null,
      endDate:          (e.eventEndDate   as string | null) ?? null,
      tags:             splitTags(e.eventInterestTags),
      ...getEventTodayTimes(e),
    }));

    const clubRows: RecommendationV2Candidate[] = clubs.map((c) => ({
      type: 'club' as const,
      id:              c.id as string,
      name:            (c.clubName          as string) ?? '',
      description:     (c.clubDescription   as string | null) ?? null,
      postcode:        (c.clubPostcode       as string | null) ?? null,
      latitude:        (c.latitude          as string | null) ?? null,
      longitude:       (c.longitude         as string | null) ?? null,
      themeSlug:       (c.themeSlug         as string) ?? '',
      themeVariantSlug:(c.themeVariantSlug   as string) ?? '',
      ageBands: {
        under1:   b(c.clubAgeSuitabilityUnder1S),
        ages1To2: b(c.clubAgeSuitability1To2Years),
        ages3To4: b(c.clubAgeSuitability3To4Years),
        ages5To7: b(c.clubAgeSuitability5To7Years),
        ages8To12:b(c.clubAgeSuitability8To12Years),
        over13:   b(c.clubAgeSuitabilityOver13Years),
        adults:   b(c.clubAgeSuitabilityAdults),
      },
      skillAreaSlug:    (c.clubSkillArea         as string | null) ?? null,
      skillAreaVariant: (c.clubSkillAreaVariant   as string | null) ?? null,
      startDate:        (c.clubStartDate as string | null) ?? null,
      endDate:          (c.clubEndDate   as string | null) ?? null,
      activeDays:       getClubActiveDays(c),
      tags:             splitTags(c.clubInterestTags),
      ...getClubTodayTimes(c),
    }));

    const routeRows: RecommendationV2Candidate[] = routes.map((r) => ({
      type: 'route' as const,
      id:              r.id as string,
      name:            (r.routeName         as string) ?? '',
      description:     (r.routeDescription  as string | null) ?? null,
      postcode:        (r.routePostcode      as string | null) ?? null,
      latitude:        (r.latitude          as string | null) ?? null,
      longitude:       (r.longitude         as string | null) ?? null,
      themeSlug:       (r.themeSlug         as string) ?? '',
      themeVariantSlug:(r.themeVariantSlug   as string) ?? '',
      ageBands: {
        under1:   b(r.routeAgeSuitabilityUnder1S),
        ages1To2: b(r.routeAgeSuitability1To2Years),
        ages3To4: b(r.routeAgeSuitability3To4Years),
        ages5To7: b(r.routeAgeSuitability5To7Years),
        ages8To12:b(r.routeAgeSuitability8To12Years),
        over13:   b(r.routeAgeSuitabilityOver13Years),
        adults:   b(r.routeAgeSuitabilityAdults),
      },
      skillAreaSlug:    null,
      skillAreaVariant: null,
      tags:             splitTags(r.routeInterestTags),
    }));

    return [...venueRows, ...eventRows, ...clubRows, ...routeRows];
  }

  async getEnrichedPayloads(refs: { type: OpportunityRecordType; id: string }[]) {
    const map = new Map<string, Record<string, unknown>>();
    if (refs.length === 0) return map;

    const venueIds = new Set(refs.filter((r) => r.type === 'venue').map((r) => r.id));
    const eventIds = new Set(refs.filter((r) => r.type === 'event').map((r) => r.id));
    const clubIds  = new Set(refs.filter((r) => r.type === 'club').map((r)  => r.id));
    const routeIds = new Set(refs.filter((r) => r.type === 'route').map((r) => r.id));

    // Asset JSON doesn't consistently carry `opportunityType` per item (e.g. venues
    // never have it) — the old DynamoDB seed rows always had it hardcoded per type,
    // and the response formatter switches on this field, so force it here.
    if (venueIds.size > 0) {
      for (const item of this.assets.getAllVenues() as unknown as Record<string, unknown>[]) {
        if (venueIds.has(item.id as string)) map.set(legKey('venue', item.id as string), { ...item, opportunityType: 'venue' });
      }
    }
    if (eventIds.size > 0) {
      for (const item of this.assets.getAllEvents() as unknown as Record<string, unknown>[]) {
        if (eventIds.has(item.id as string)) map.set(legKey('event', item.id as string), { ...item, opportunityType: 'event' });
      }
    }
    if (clubIds.size > 0) {
      for (const item of this.assets.getAllClubs() as unknown as Record<string, unknown>[]) {
        if (clubIds.has(item.id as string)) map.set(legKey('club', item.id as string), { ...item, opportunityType: 'club' });
      }
    }
    if (routeIds.size > 0) {
      for (const item of this.assets.getAllRoutes() as unknown as Record<string, unknown>[]) {
        if (routeIds.has(item.id as string)) map.set(legKey('route', item.id as string), { ...item, opportunityType: 'route' });
      }
    }
    return map;
  }
}
