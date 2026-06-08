import { GetCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";
import db from "../../database/database.config.js";
import { TABLES } from "../../database/tables.js";
import { batchGetItems } from "../../database/dynamo-helpers.js";

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
    openingDaysAndTimes: (item.openingDaysAndTimes as string | null) ?? null,
    openingExclusions: (item.openingExclusions as string | null) ?? null,
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
    interestTags: (item.interestTags as string | null) ?? null,
    estimatedTimeToSpend: (item.estimatedTimeToSpend as string | null) ?? null,
    seasonalTagSlug: (item.seasonalTagSlug as string | null) ?? null,
    seasonalHighlightSlugs: (item.seasonalHighlightSlugs as string[]) ?? [],
    highlightAttractionSlugs: (item.highlightAttractionSlugs as string[]) ?? [],
    createdAt: new Date(item.createdAt as string),
    updatedAt: new Date(item.updatedAt as string),
  };
}

async function hydrateWishlistItems(items: Record<string, unknown>[]) {
  return Promise.all(
    items
      .sort((a, b) => (a.createdAt as string).localeCompare(b.createdAt as string))
      .map(async (item) => {
        const venueId = item.opportunityVenueId as string | null;
        const eventId = item.opportunityEventId as string | null;
        const clubId = item.opportunityClubId as string | null;
        const routeId = item.opportunityRouteId as string | null;

        const [venueRes, eventRes, clubRes, routeRes] = await Promise.all([
          venueId ? db.send(new GetCommand({ TableName: TABLES.opportunityVenues, Key: { id: venueId } })) : null,
          eventId ? db.send(new GetCommand({ TableName: TABLES.opportunityEvents, Key: { id: eventId } })) : null,
          clubId ? db.send(new GetCommand({ TableName: TABLES.opportunityClubs, Key: { id: clubId } })) : null,
          routeId ? db.send(new GetCommand({ TableName: TABLES.opportunityRoutes, Key: { id: routeId } })) : null,
        ]);

        return {
          id: item.id as string,
          wishlistId: item.wishlistId as string,
          opportunityVenueId: venueId,
          opportunityEventId: eventId,
          opportunityClubId: clubId,
          opportunityRouteId: routeId,
          opportunityVenue: venueRes?.Item ? fromDbVenue(venueRes.Item as Record<string, unknown>) : null,
          opportunityEvent: eventRes?.Item ? eventRes.Item : null,
          opportunityClub: clubRes?.Item ? clubRes.Item : null,
          opportunityRoute: routeRes?.Item ? routeRes.Item : null,
          createdAt: new Date(item.createdAt as string),
          updatedAt: new Date(item.updatedAt as string),
        };
      }),
  );
}

async function hydrateWishlists(wishlistItems: Record<string, unknown>[]) {
  return Promise.all(
    wishlistItems.map(async (wl) => {
      const itemsRes = await db.send(
        new QueryCommand({
          TableName: TABLES.wishlistItems,
          IndexName: "wishlistId-index",
          KeyConditionExpression: "wishlistId = :wid",
          ExpressionAttributeValues: { ":wid": wl.id },
        }),
      );
      const items = await hydrateWishlistItems(
        (itemsRes.Items ?? []) as Record<string, unknown>[],
      );
      return {
        id: wl.id as string,
        name: wl.name as string,
        color: wl.color as string,
        parentId: wl.parentId as string,
        childId: wl.childId as string,
        createdAt: new Date(wl.createdAt as string),
        updatedAt: new Date(wl.updatedAt as string),
        items,
      };
    }),
  );
}

export class WishlistRepository {
  async findByParentId(parentId: string, childId?: string) {
    const res = await db.send(
      new QueryCommand({
        TableName: TABLES.wishlists,
        IndexName: "parentId-index",
        KeyConditionExpression: "parentId = :pid",
        ExpressionAttributeValues: { ":pid": parentId },
      }),
    );
    let wlItems = (res.Items ?? []) as Record<string, unknown>[];
    if (childId) wlItems = wlItems.filter((i) => i.childId === childId);
    wlItems.sort((a, b) => (b.createdAt as string).localeCompare(a.createdAt as string));
    return hydrateWishlists(wlItems);
  }

  async create(data: {
    parentId: string;
    childId: string;
    name: string;
    color: string;
    items: Array<{
      opportunityVenueId?: string;
      opportunityEventId?: string;
      opportunityClubId?: string;
      opportunityRouteId?: string;
    }>;
  }) {
    const wishlistId = uuidv4();
    const now = new Date().toISOString();

    await db.send(
      new PutCommand({
        TableName: TABLES.wishlists,
        Item: {
          id: wishlistId,
          parentId: data.parentId,
          childId: data.childId,
          name: data.name,
          color: data.color,
          createdAt: now,
          updatedAt: now,
        },
      }),
    );

    await Promise.all(
      data.items.map((item) => {
        if (
          !item.opportunityVenueId &&
          !item.opportunityEventId &&
          !item.opportunityClubId &&
          !item.opportunityRouteId
        ) {
          throw new Error("Wishlist item must reference exactly one opportunity");
        }
        return db.send(
          new PutCommand({
            TableName: TABLES.wishlistItems,
            Item: {
              id: uuidv4(),
              wishlistId,
              opportunityVenueId: item.opportunityVenueId ?? null,
              opportunityEventId: item.opportunityEventId ?? null,
              opportunityClubId: item.opportunityClubId ?? null,
              opportunityRouteId: item.opportunityRouteId ?? null,
              createdAt: now,
              updatedAt: now,
            },
          }),
        );
      }),
    );

    const wlRes = await db.send(new GetCommand({ TableName: TABLES.wishlists, Key: { id: wishlistId } }));
    const [hydrated] = await hydrateWishlists([wlRes.Item as Record<string, unknown>]);
    return hydrated;
  }

  async opportunityIdsExist(items: {
    venueIds: string[];
    eventIds: string[];
    clubIds: string[];
    routeIds: string[];
  }): Promise<boolean> {
    const checks: Promise<boolean>[] = [];

    if (items.venueIds.length > 0) {
      const unique = [...new Set(items.venueIds)];
      checks.push(batchGetItems(TABLES.opportunityVenues, unique).then((r) => r.length === unique.length));
    }
    if (items.eventIds.length > 0) {
      const unique = [...new Set(items.eventIds)];
      checks.push(batchGetItems(TABLES.opportunityEvents, unique).then((r) => r.length === unique.length));
    }
    if (items.clubIds.length > 0) {
      const unique = [...new Set(items.clubIds)];
      checks.push(batchGetItems(TABLES.opportunityClubs, unique).then((r) => r.length === unique.length));
    }
    if (items.routeIds.length > 0) {
      const unique = [...new Set(items.routeIds)];
      checks.push(batchGetItems(TABLES.opportunityRoutes, unique).then((r) => r.length === unique.length));
    }

    const results = await Promise.all(checks);
    return results.every(Boolean);
  }

  async parentExists(id: string): Promise<boolean> {
    const res = await db.send(new GetCommand({ TableName: TABLES.parents, Key: { id } }));
    return !!res.Item;
  }

  async childBelongsToParent(childId: string, parentId: string): Promise<boolean> {
    const res = await db.send(new GetCommand({ TableName: TABLES.children, Key: { id: childId } }));
    if (!res.Item) return false;
    return (res.Item as Record<string, unknown>).parentId === parentId;
  }
}
