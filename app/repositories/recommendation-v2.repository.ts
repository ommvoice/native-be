import { GetCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import db from '../shared/db/dynamo-client';
import { TABLES } from '../shared/db/tables';
import { batchGetItems, scanAll } from '../shared/db/dynamo-helpers';
import type { RecommendationV2Candidate } from '../dtos/recommendation.dto';
import type { OpportunityRecordType } from './driving-leg.repository';
import { legKey } from './driving-leg.repository';

function b(v: unknown): boolean | null {
  return typeof v === 'boolean' ? v : null;
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
  async getParentForRecommendations(parentId: string, childId?: string) {
    const res = await db.send(new GetCommand({ TableName: TABLES.parents, Key: { id: parentId } }));
    if (!res.Item) return null;
    const item = res.Item as Record<string, unknown>;

    const categoryIds    = (item.interestCategoryIds    as string[]) ?? [];
    const subCategoryIds = (item.interestSubCategoryIds as string[]) ?? [];

    const [catItems, subItems, children] = await Promise.all([
      categoryIds.length    > 0 ? batchGetItems(TABLES.opportunityThemes,        categoryIds)    : [],
      subCategoryIds.length > 0 ? batchGetItems(TABLES.opportunityThemeVariants, subCategoryIds) : [],
      this.getChildrenForParent(parentId, childId),
    ]);

    return {
      id:                     item.id as string,
      postCode:               item.postCode as string,
      latitude:               item.latitude as string,
      longitude:              item.longitude as string,
      searchRadius:           item.searchRadius as number,
      interestCategories:     catItems.map((c) => ({ slug: c.slug as string })),
      interestSubCategories:  subItems.map((s) => ({ slug: s.slug as string })),
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

    return Promise.all(
      filtered.map(async (item) => {
        const categoryIds    = (item.interestCategoryIds    as string[]) ?? [];
        const subCategoryIds = (item.interestSubCategoryIds as string[]) ?? [];
        const skillIds       = (item.skillIds               as string[]) ?? [];

        const [catItems, subItems, skillItems] = await Promise.all([
          categoryIds.length    > 0 ? batchGetItems(TABLES.opportunityThemes,        categoryIds)    : [],
          subCategoryIds.length > 0 ? batchGetItems(TABLES.opportunityThemeVariants, subCategoryIds) : [],
          skillIds.length       > 0 ? batchGetItems(TABLES.skills,                   skillIds)       : [],
        ]);

        const subCategoryIdSet  = new Set(skillItems.map((s) => s.subCategoryId as string).filter(Boolean));
        const subCatItems       = subCategoryIdSet.size > 0
          ? await batchGetItems(TABLES.opportunityThemes, [...subCategoryIdSet])
          : [];
        const subCatSlugMap     = new Map(subCatItems.map((s) => [s.id as string, s.slug as string]));

        return {
          id:                    item.id as string,
          dateOfBirth:           new Date(item.dateOfBirth as string),
          interestCategories:    catItems.map((c) => ({ slug: c.slug as string })),
          interestSubCategories: subItems.map((s) => ({ slug: s.slug as string })),
          skills: skillItems.map((s) => ({
            slug:        s.slug as string,
            minAge:      (s.minAge as number | null) ?? null,
            maxAge:      (s.maxAge as number | null) ?? null,
            subCategory: s.subCategoryId
              ? { slug: subCatSlugMap.get(s.subCategoryId as string) ?? '' }
              : null,
          })),
        };
      }),
    );
  }

  async getOpportunityCandidatesV2(): Promise<RecommendationV2Candidate[]> {
    const [venues, events, clubs, routes] = await Promise.all([
      scanAll(TABLES.opportunityVenuesV2),
      scanAll(TABLES.opportunityEventsV2),
      scanAll(TABLES.opportunityClubsV2),
      scanAll(TABLES.opportunityRoutesV2),
    ]);

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
    }));

    return [...venueRows, ...eventRows, ...clubRows, ...routeRows];
  }

  async getEnrichedPayloads(refs: { type: OpportunityRecordType; id: string }[]) {
    if (refs.length === 0) return new Map<string, Record<string, unknown>>();

    const venueIds = [...new Set(refs.filter((r) => r.type === 'venue').map((r) => r.id))];
    const eventIds = [...new Set(refs.filter((r) => r.type === 'event').map((r) => r.id))];
    const clubIds  = [...new Set(refs.filter((r) => r.type === 'club').map((r)  => r.id))];
    const routeIds = [...new Set(refs.filter((r) => r.type === 'route').map((r) => r.id))];

    const [venueItems, eventItems, clubItems, routeItems] = await Promise.all([
      venueIds.length > 0 ? batchGetItems(TABLES.opportunityVenuesV2, venueIds) : [],
      eventIds.length > 0 ? batchGetItems(TABLES.opportunityEventsV2, eventIds) : [],
      clubIds.length  > 0 ? batchGetItems(TABLES.opportunityClubsV2,  clubIds)  : [],
      routeIds.length > 0 ? batchGetItems(TABLES.opportunityRoutesV2, routeIds) : [],
    ]);

    const map = new Map<string, Record<string, unknown>>();
    for (const item of venueItems) map.set(legKey('venue', item.id as string), item);
    for (const item of eventItems) map.set(legKey('event', item.id as string), item);
    for (const item of clubItems)  map.set(legKey('club',  item.id as string), item);
    for (const item of routeItems) map.set(legKey('route', item.id as string), item);
    return map;
  }
}
