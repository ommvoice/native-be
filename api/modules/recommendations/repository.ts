import { GetCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import db from "../../database/database.config.js";
import { TABLES } from "../../database/tables.js";
import { batchGetItems } from "../../database/dynamo-helpers.js";
import type { OpportunityRecordType } from "../../types/db.js";
import { enrichOpportunityClubResponse } from "../opportunity/clubs/helpers.js";
import { enrichOpportunityEventResponse } from "../opportunity/events/helpers.js";
import { enrichOpportunityRouteResponse } from "../opportunity/routes/helpers.js";
import { enrichOpportunityVenueResponse } from "../opportunity/venues/helpers.js";
import { legKey } from "./driving-leg.repository.js";
import type { RecommendationCandidate, RecommendationOpportunityPayload } from "./types.js";

function fromDbVenue(item: Record<string, unknown>) {
  return {
    id: item.id as string,
    type: "venue" as const,
    name: item.name as string,
    description: (item.description as string | null) ?? null,
    postCode: (item.postCode as string | null) ?? null,
    latitude: (item.latitude as string | null) ?? null,
    longitude: (item.longitude as string | null) ?? null,
    venuePostcode: (item.venuePostcode as string | null) ?? null,
    interestTags: (item.interestTags as string | null) ?? null,
    themeSlug: item.themeSlug as string,
    themeVariantSlug: (item.themeVariantSlug as string | null) ?? null,
    activityGroupSlug: (item.activityGroupSlug as string | null) ?? null,
    terrainTypeSlug: (item.terrainTypeSlug as string | null) ?? null,
    venueSettingSlug: (item.venueSettingSlug as string | null) ?? null,
    parkingProvisionSlug: (item.parkingProvisionSlug as string | null) ?? null,
    adultCost: (item.adultCost as number | null) ?? null,
    childCost: (item.childCost as number | null) ?? null,
    infantCost: (item.infantCost as number | null) ?? null,
    generalFacilitySlugs: (item.generalFacilitySlugs as string[]) ?? [],
    kidsFacilitySlugs: (item.kidsFacilitySlugs as string[]) ?? [],
    parentFacilitySlugs: (item.parentFacilitySlugs as string[]) ?? [],
    dogFacilitySlugs: (item.dogFacilitySlugs as string[]) ?? [],
    ageSuitabilitySlugs: (item.ageSuitabilitySlugs as string[]) ?? [],
    extraKitSlugs: (item.extraKitSlugs as string[]) ?? [],
    estimatedTimeToSpend: (item.estimatedTimeToSpend as string | null) ?? null,
    openingDaysAndTimes: (item.openingDaysAndTimes as string | null) ?? null,
    openingExclusions: (item.openingExclusions as string | null) ?? null,
    seasonalTagSlug: (item.seasonalTagSlug as string | null) ?? null,
    seasonalHighlightSlugs: (item.seasonalHighlightSlugs as string[]) ?? [],
    highlightAttractionSlugs: (item.highlightAttractionSlugs as string[]) ?? [],
    createdAt: new Date(item.createdAt as string),
    updatedAt: new Date(item.updatedAt as string),
  };
}

function fromDbEvent(item: Record<string, unknown>) {
  return {
    id: item.id as string,
    type: "event" as const,
    name: item.name as string,
    description: (item.description as string | null) ?? null,
    postCode: (item.postCode as string | null) ?? null,
    latitude: (item.latitude as string | null) ?? null,
    longitude: (item.longitude as string | null) ?? null,
    themeSlug: item.themeSlug as string,
    themeVariantSlug: (item.themeVariantSlug as string | null) ?? null,
    eventTypeSlug: item.eventTypeSlug as string,
    activityGroupSlug: (item.activityGroupSlug as string | null) ?? null,
    startDate: item.startDate ? new Date(item.startDate as string) : null,
    endDate: item.endDate ? new Date(item.endDate as string) : null,
    startTime: (item.startTime as string | null) ?? null,
    finishTime: (item.finishTime as string | null) ?? null,
    venuePostCode: (item.venuePostCode as string | null) ?? null,
    parkingProvisionSlug: (item.parkingProvisionSlug as string | null) ?? null,
    venueSettingSlug: (item.venueSettingSlug as string | null) ?? null,
    generalFacilitySlugs: (item.generalFacilitySlugs as string[]) ?? [],
    kidsFacilitySlugs: (item.kidsFacilitySlugs as string[]) ?? [],
    parentFacilitySlugs: (item.parentFacilitySlugs as string[]) ?? [],
    adultCost: (item.adultCost as number | null) ?? null,
    childCost: (item.childCost as number | null) ?? null,
    infantCost: (item.infantCost as number | null) ?? null,
    ageSuitabilitySlugs: (item.ageSuitabilitySlugs as string[]) ?? [],
    skillAreaSlug: (item.skillAreaSlug as string | null) ?? null,
    skillAreaVariant: (item.skillAreaVariant as string | null) ?? null,
    abilityLevelSlug: (item.abilityLevelSlug as string | null) ?? null,
    extraKitSlugs: (item.extraKitSlugs as string[]) ?? [],
    interestTags: (item.interestTags as string | null) ?? null,
    seasonalTagSlug: (item.seasonalTagSlug as string | null) ?? null,
    seasonalHighlightSlugs: (item.seasonalHighlightSlugs as string[]) ?? [],
    highlightAttractionSlugs: (item.highlightAttractionSlugs as string[]) ?? [],
    createdAt: new Date(item.createdAt as string),
    updatedAt: new Date(item.updatedAt as string),
  };
}

function fromDbClub(item: Record<string, unknown>) {
  return {
    id: item.id as string,
    type: "club" as const,
    name: item.name as string,
    description: (item.description as string | null) ?? null,
    postCode: (item.postCode as string | null) ?? null,
    latitude: (item.latitude as string | null) ?? null,
    longitude: (item.longitude as string | null) ?? null,
    themeSlug: item.themeSlug as string,
    themeVariantSlug: (item.themeVariantSlug as string | null) ?? null,
    venuePostCode: (item.venuePostCode as string | null) ?? null,
    startTime: (item.startTime as string | null) ?? null,
    finishTime: (item.finishTime as string | null) ?? null,
    dayOfWeekSlug: (item.dayOfWeekSlug as string | null) ?? null,
    activityGroupSlug: (item.activityGroupSlug as string | null) ?? null,
    clubFormatSlug: (item.clubFormatSlug as string | null) ?? null,
    clubFrequencySlug: (item.clubFrequencySlug as string | null) ?? null,
    commitmentSlug: (item.commitmentSlug as string | null) ?? null,
    skillAreaSlug: (item.skillAreaSlug as string | null) ?? null,
    skillAreaVariant: (item.skillAreaVariant as string | null) ?? null,
    abilityLevelSlug: (item.abilityLevelSlug as string | null) ?? null,
    parkingProvisionSlug: (item.parkingProvisionSlug as string | null) ?? null,
    venueSettingSlug: (item.venueSettingSlug as string | null) ?? null,
    adultCost: (item.adultCost as number | null) ?? null,
    childCost: (item.childCost as number | null) ?? null,
    infantCost: (item.infantCost as number | null) ?? null,
    generalFacilitySlugs: (item.generalFacilitySlugs as string[]) ?? [],
    kidsFacilitySlugs: (item.kidsFacilitySlugs as string[]) ?? [],
    parentFacilitySlugs: (item.parentFacilitySlugs as string[]) ?? [],
    ageSuitabilitySlugs: (item.ageSuitabilitySlugs as string[]) ?? [],
    extraKitSlugs: (item.extraKitSlugs as string[]) ?? [],
    interestTags: (item.interestTags as string | null) ?? null,
    seasonalTagSlug: (item.seasonalTagSlug as string | null) ?? null,
    seasonalHighlightSlugs: (item.seasonalHighlightSlugs as string[]) ?? [],
    highlightAttractionSlugs: (item.highlightAttractionSlugs as string[]) ?? [],
    createdAt: new Date(item.createdAt as string),
    updatedAt: new Date(item.updatedAt as string),
  };
}

function fromDbRoute(item: Record<string, unknown>) {
  return {
    id: item.id as string,
    type: "route" as const,
    name: item.name as string,
    description: (item.description as string | null) ?? null,
    postCode: (item.postCode as string | null) ?? null,
    latitude: (item.latitude as string | null) ?? null,
    longitude: (item.longitude as string | null) ?? null,
    themeSlug: item.themeSlug as string,
    themeVariantSlug: (item.themeVariantSlug as string | null) ?? null,
    routeTypeSlug: (item.routeTypeSlug as string | null) ?? null,
    routeDistanceMiles: (item.routeDistanceMiles as number | null) ?? null,
    routeSuitabilitySlugs: (item.routeSuitabilitySlugs as string[]) ?? [],
    terrainTypeSlugs: (item.terrainTypeSlugs as string[]) ?? [],
    difficultyRatingSlug: (item.difficultyRatingSlug as string | null) ?? null,
    activityGroupSlug: (item.activityGroupSlug as string | null) ?? null,
    startPointPostCode: (item.startPointPostCode as string | null) ?? null,
    parkingProvisionSlug: (item.parkingProvisionSlug as string | null) ?? null,
    venueSettingSlug: (item.venueSettingSlug as string | null) ?? null,
    generalFacilitySlugs: (item.generalFacilitySlugs as string[]) ?? [],
    kidsFacilitySlugs: (item.kidsFacilitySlugs as string[]) ?? [],
    parentFacilitySlugs: (item.parentFacilitySlugs as string[]) ?? [],
    dogFacilitySlugs: (item.dogFacilitySlugs as string[]) ?? [],
    extraKitSlugs: (item.extraKitSlugs as string[]) ?? [],
    adultCost: (item.adultCost as number | null) ?? null,
    childCost: (item.childCost as number | null) ?? null,
    infantCost: (item.infantCost as number | null) ?? null,
    interestTags: (item.interestTags as string | null) ?? null,
    seasonalTagSlug: (item.seasonalTagSlug as string | null) ?? null,
    seasonalHighlightSlugs: (item.seasonalHighlightSlugs as string[]) ?? [],
    highlightAttractionSlugs: (item.highlightAttractionSlugs as string[]) ?? [],
    createdAt: new Date(item.createdAt as string),
    updatedAt: new Date(item.updatedAt as string),
  };
}

async function scanTable(tableName: string): Promise<Record<string, unknown>[]> {
  const { ScanCommand } = await import("@aws-sdk/lib-dynamodb");
  const results: Record<string, unknown>[] = [];
  let lastKey: Record<string, unknown> | undefined;
  do {
    const res = await db.send(
      new ScanCommand({ TableName: tableName, ...(lastKey ? { ExclusiveStartKey: lastKey } : {}) }),
    );
    results.push(...((res.Items ?? []) as Record<string, unknown>[]));
    lastKey = res.LastEvaluatedKey as Record<string, unknown> | undefined;
  } while (lastKey);
  return results;
}

async function getChildrenForParent(
  parentId: string,
  childId?: string,
): Promise<
  {
    id: string;
    nameOrNickName: string;
    dateOfBirth: Date;
    parentId: string;
    interestCategories: { slug: string }[];
    interestSubCategories: { slug: string }[];
    skills: { slug: string; minAge: number | null; maxAge: number | null; subCategory: { slug: string } | null }[];
  }[]
> {
  const res = await db.send(
    new QueryCommand({
      TableName: TABLES.children,
      IndexName: "parentId-index",
      KeyConditionExpression: "parentId = :pid",
      ExpressionAttributeValues: { ":pid": parentId },
    }),
  );
  const items = (res.Items ?? []) as Record<string, unknown>[];
  const filtered = childId ? items.filter((i) => i.id === childId) : items;

  return Promise.all(
    filtered.map(async (item) => {
      const categoryIds = (item.interestCategoryIds as string[]) ?? [];
      const subCategoryIds = (item.interestSubCategoryIds as string[]) ?? [];
      const skillIds = (item.skillIds as string[]) ?? [];

      const [catItems, subItems, skillItems] = await Promise.all([
        categoryIds.length > 0 ? batchGetItems(TABLES.interestCategories, categoryIds) : [],
        subCategoryIds.length > 0 ? batchGetItems(TABLES.interestSubCategories, subCategoryIds) : [],
        skillIds.length > 0 ? batchGetItems(TABLES.skills, skillIds) : [],
      ]);

      const subCategoryIdSet = new Set(skillItems.map((s) => s.subCategoryId as string).filter(Boolean));
      const subCatItems =
        subCategoryIdSet.size > 0
          ? await batchGetItems(TABLES.interestSubCategories, [...subCategoryIdSet])
          : [];
      const subCatSlugMap = new Map(subCatItems.map((s) => [s.id as string, s.slug as string]));

      return {
        id: item.id as string,
        nameOrNickName: item.nameOrNickName as string,
        dateOfBirth: new Date(item.dateOfBirth as string),
        parentId: item.parentId as string,
        createdAt: new Date(item.createdAt as string),
        updatedAt: new Date(item.updatedAt as string),
        interestCategories: catItems.map((c) => ({ slug: c.slug as string })),
        interestSubCategories: subItems.map((s) => ({ slug: s.slug as string })),
        skills: skillItems.map((s) => ({
          slug: s.slug as string,
          minAge: (s.minAge as number | null) ?? null,
          maxAge: (s.maxAge as number | null) ?? null,
          subCategory: s.subCategoryId
            ? { slug: subCatSlugMap.get(s.subCategoryId as string) ?? "" }
            : null,
        })),
      };
    }),
  );
}

export class RecommendationsRepository {
  async getParentForRecommendations(parentId: string, childId?: string) {
    const res = await db.send(new GetCommand({ TableName: TABLES.parents, Key: { id: parentId } }));
    if (!res.Item) return null;
    const item = res.Item as Record<string, unknown>;

    const categoryIds = (item.interestCategoryIds as string[]) ?? [];
    const subCategoryIds = (item.interestSubCategoryIds as string[]) ?? [];

    const [catItems, subItems, children] = await Promise.all([
      categoryIds.length > 0 ? batchGetItems(TABLES.interestCategories, categoryIds) : [],
      subCategoryIds.length > 0 ? batchGetItems(TABLES.interestSubCategories, subCategoryIds) : [],
      getChildrenForParent(parentId, childId),
    ]);

    return {
      id: item.id as string,
      postCode: item.postCode as string,
      firstNameOrNickName: item.firstNameOrNickName as string,
      latitude: item.latitude as string,
      longitude: item.longitude as string,
      searchRadius: item.searchRadius as number,
      userId: item.userId as string,
      createdAt: new Date(item.createdAt as string),
      updatedAt: new Date(item.updatedAt as string),
      interestCategories: catItems.map((c) => ({ slug: c.slug as string })),
      interestSubCategories: subItems.map((s) => ({ slug: s.slug as string })),
      children,
    };
  }

  async getOpportunityCandidates(): Promise<RecommendationCandidate[]> {
    const [venues, events, clubs, routes] = await Promise.all([
      scanTable(TABLES.opportunityVenues),
      scanTable(TABLES.opportunityEvents),
      scanTable(TABLES.opportunityClubs),
      scanTable(TABLES.opportunityRoutes),
    ]);

    const venueRows: RecommendationCandidate[] = venues.map((v) => ({
      type: "venue" as const,
      id: v.id as string,
      name: v.name as string,
      description: (v.description as string | null) ?? null,
      postcode: (v.postCode as string | null) ?? (v.venuePostcode as string | null),
      latitude: (v.latitude as string | null) ?? null,
      longitude: (v.longitude as string | null) ?? null,
      interestTags: (v.interestTags as string | null) ?? null,
      themeSlug: v.themeSlug as string,
      ageSuitabilitySlugs: (v.ageSuitabilitySlugs as string[]) ?? [],
      skillAreaSlug: null,
      skillAreaVariant: null,
    }));

    const eventRows: RecommendationCandidate[] = events.map((e) => ({
      type: "event" as const,
      id: e.id as string,
      name: e.name as string,
      description: (e.description as string | null) ?? null,
      postcode: (e.postCode as string | null) ?? (e.venuePostCode as string | null),
      latitude: (e.latitude as string | null) ?? null,
      longitude: (e.longitude as string | null) ?? null,
      interestTags: (e.interestTags as string | null) ?? null,
      themeSlug: e.themeSlug as string,
      ageSuitabilitySlugs: (e.ageSuitabilitySlugs as string[]) ?? [],
      skillAreaSlug: (e.skillAreaSlug as string | null) ?? null,
      skillAreaVariant: (e.skillAreaVariant as string | null) ?? null,
    }));

    const clubRows: RecommendationCandidate[] = clubs.map((c) => ({
      type: "club" as const,
      id: c.id as string,
      name: c.name as string,
      description: (c.description as string | null) ?? null,
      postcode: (c.postCode as string | null) ?? (c.venuePostCode as string | null),
      latitude: (c.latitude as string | null) ?? null,
      longitude: (c.longitude as string | null) ?? null,
      interestTags: (c.interestTags as string | null) ?? null,
      themeSlug: c.themeSlug as string,
      ageSuitabilitySlugs: (c.ageSuitabilitySlugs as string[]) ?? [],
      skillAreaSlug: (c.skillAreaSlug as string | null) ?? null,
      skillAreaVariant: (c.skillAreaVariant as string | null) ?? null,
    }));

    const routeRows: RecommendationCandidate[] = routes.map((r) => ({
      type: "route" as const,
      id: r.id as string,
      name: r.name as string,
      description: (r.description as string | null) ?? null,
      postcode: (r.postCode as string | null) ?? (r.startPointPostCode as string | null),
      latitude: (r.latitude as string | null) ?? null,
      longitude: (r.longitude as string | null) ?? null,
      interestTags: (r.interestTags as string | null) ?? null,
      themeSlug: r.themeSlug as string,
      ageSuitabilitySlugs: [],
      skillAreaSlug: null,
      skillAreaVariant: null,
    }));

    return [...venueRows, ...eventRows, ...clubRows, ...routeRows];
  }

  async getEnrichedOpportunityPayloadsForRecommendations(
    refs: { type: OpportunityRecordType; id: string }[],
  ): Promise<Map<string, RecommendationOpportunityPayload>> {
    const map = new Map<string, RecommendationOpportunityPayload>();
    if (refs.length === 0) return map;

    const venueIds = [...new Set(refs.filter((r) => r.type === "venue").map((r) => r.id))];
    const eventIds = [...new Set(refs.filter((r) => r.type === "event").map((r) => r.id))];
    const clubIds = [...new Set(refs.filter((r) => r.type === "club").map((r) => r.id))];
    const routeIds = [...new Set(refs.filter((r) => r.type === "route").map((r) => r.id))];

    const [venueItems, eventItems, clubItems, routeItems] = await Promise.all([
      venueIds.length > 0 ? batchGetItems(TABLES.opportunityVenues, venueIds) : [],
      eventIds.length > 0 ? batchGetItems(TABLES.opportunityEvents, eventIds) : [],
      clubIds.length > 0 ? batchGetItems(TABLES.opportunityClubs, clubIds) : [],
      routeIds.length > 0 ? batchGetItems(TABLES.opportunityRoutes, routeIds) : [],
    ]);

    for (const item of venueItems) {
      map.set(legKey("venue", item.id as string), enrichOpportunityVenueResponse(fromDbVenue(item)));
    }
    for (const item of eventItems) {
      map.set(legKey("event", item.id as string), enrichOpportunityEventResponse(fromDbEvent(item)));
    }
    for (const item of clubItems) {
      map.set(legKey("club", item.id as string), enrichOpportunityClubResponse(fromDbClub(item)));
    }
    for (const item of routeItems) {
      map.set(legKey("route", item.id as string), enrichOpportunityRouteResponse(fromDbRoute(item)));
    }

    return map;
  }
}
