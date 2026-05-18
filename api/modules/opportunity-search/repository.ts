import { GetCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import db from "../../database/database.config.js";
import { TABLES } from "../../database/tables.js";
import { batchGetItems } from "../../database/dynamo-helpers.js";
import type { OpportunityRecordType } from "../../types/db.js";
import type { OpportunitySearchCandidateRow, OpportunitySearchDrivingLegRow } from "./types.js";

const METERS_PER_MILE = 1609.344;

export function maxDrivingDistanceMetersFromMiles(maxDistanceMiles: number): number {
  return Math.floor(maxDistanceMiles * METERS_PER_MILE);
}

export class OpportunitySearchRepository {
  async findFacilityBySlug(slug: string): Promise<{ slug: string } | null> {
    const normalized = slug.trim().toLowerCase();
    if (!normalized) return null;
    const { ScanCommand } = await import("@aws-sdk/lib-dynamodb");
    const res = await db.send(
      new ScanCommand({
        TableName: TABLES.facilities,
        FilterExpression: "#slug = :slug",
        ExpressionAttributeNames: { "#slug": "slug" },
        ExpressionAttributeValues: { ":slug": normalized },
        Limit: 1,
      }),
    );
    const item = res.Items?.[0];
    return item ? { slug: item.slug as string } : null;
  }

  async findChildInterestSubCategorySlugs(
    parentId: string,
    childId: string,
  ): Promise<string[] | null> {
    const res = await db.send(
      new QueryCommand({
        TableName: TABLES.children,
        IndexName: "parentId-index",
        KeyConditionExpression: "parentId = :pid",
        ExpressionAttributeValues: { ":pid": parentId },
      }),
    );
    const child = (res.Items ?? []).find((i) => i.id === childId);
    if (!child) return null;
    const subCategoryIds = (child.interestSubCategoryIds as string[]) ?? [];
    if (subCategoryIds.length === 0) return [];
    const subItems = await batchGetItems(TABLES.interestSubCategories, subCategoryIds);
    return subItems.map((i) => i.slug as string);
  }

  async findParentLatLon(
    parentId: string,
  ): Promise<{ latitude: string; longitude: string } | null> {
    const res = await db.send(new GetCommand({ TableName: TABLES.parents, Key: { id: parentId } }));
    if (!res.Item) return null;
    const item = res.Item as Record<string, unknown>;
    return { latitude: item.latitude as string, longitude: item.longitude as string };
  }

  async listDrivingLegsForParent(
    parentId: string,
    opts: { maxDurationSeconds?: number; maxDistanceMeters?: number },
  ): Promise<OpportunitySearchDrivingLegRow[]> {
    const conditions: string[] = ["parentId = :pid"];
    const names: Record<string, string> = {};
    const values: Record<string, unknown> = { ":pid": parentId };

    let filterParts: string[] = [];
    if (opts.maxDurationSeconds != null) {
      filterParts.push("drivingDurationSeconds <= :maxDur");
      values[":maxDur"] = opts.maxDurationSeconds;
    }
    if (opts.maxDistanceMeters != null) {
      filterParts.push("drivingDistanceMeters <= :maxDist");
      values[":maxDist"] = opts.maxDistanceMeters;
    }

    const queryParams: Record<string, unknown> = {
      TableName: TABLES.drivingLegs,
      KeyConditionExpression: conditions.join(" AND "),
      ExpressionAttributeValues: values,
    };
    if (Object.keys(names).length > 0) queryParams.ExpressionAttributeNames = names;
    if (filterParts.length > 0) queryParams.FilterExpression = filterParts.join(" AND ");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res = await db.send(new QueryCommand(queryParams as any));
    return ((res.Items ?? []) as Record<string, unknown>[]).map((i) => ({
      opportunityType: i.opportunityType as OpportunityRecordType,
      opportunityId: i.opportunityId as string,
      drivingDistanceMeters: i.drivingDistanceMeters as number,
      drivingDurationSeconds: i.drivingDurationSeconds as number,
      parentLatitude: i.parentLatitude as string,
      parentLongitude: i.parentLongitude as string,
      opportunityLatitude: i.opportunityLatitude as string,
      opportunityLongitude: i.opportunityLongitude as string,
    }));
  }

  async findCandidatesByRefs(
    refs: { type: OpportunityRecordType; id: string }[],
  ): Promise<OpportunitySearchCandidateRow[]> {
    if (refs.length === 0) return [];

    const venueIds = [...new Set(refs.filter((r) => r.type === "venue").map((r) => r.id))];
    const eventIds = [...new Set(refs.filter((r) => r.type === "event").map((r) => r.id))];
    const clubIds = [...new Set(refs.filter((r) => r.type === "club").map((r) => r.id))];
    const routeIds = [...new Set(refs.filter((r) => r.type === "route").map((r) => r.id))];

    const [venues, events, clubs, routes] = await Promise.all([
      venueIds.length > 0 ? batchGetItems(TABLES.opportunityVenues, venueIds) : [],
      eventIds.length > 0 ? batchGetItems(TABLES.opportunityEvents, eventIds) : [],
      clubIds.length > 0 ? batchGetItems(TABLES.opportunityClubs, clubIds) : [],
      routeIds.length > 0 ? batchGetItems(TABLES.opportunityRoutes, routeIds) : [],
    ]);

    const out: OpportunitySearchCandidateRow[] = [];

    for (const v of venues) {
      out.push({
        type: "venue",
        id: v.id as string,
        interestTags: (v.interestTags as string | null) ?? null,
        themeSlug: v.themeSlug as string,
        latitude: (v.latitude as string | null) ?? null,
        longitude: (v.longitude as string | null) ?? null,
        generalFacilitySlugs: (v.generalFacilitySlugs as string[]) ?? [],
        kidsFacilitySlugs: (v.kidsFacilitySlugs as string[]) ?? [],
        parentFacilitySlugs: (v.parentFacilitySlugs as string[]) ?? [],
        dogFacilitySlugs: (v.dogFacilitySlugs as string[]) ?? [],
      });
    }
    for (const e of events) {
      out.push({
        type: "event",
        id: e.id as string,
        interestTags: (e.interestTags as string | null) ?? null,
        themeSlug: e.themeSlug as string,
        latitude: (e.latitude as string | null) ?? null,
        longitude: (e.longitude as string | null) ?? null,
        generalFacilitySlugs: (e.generalFacilitySlugs as string[]) ?? [],
        kidsFacilitySlugs: (e.kidsFacilitySlugs as string[]) ?? [],
        parentFacilitySlugs: (e.parentFacilitySlugs as string[]) ?? [],
        dogFacilitySlugs: [],
      });
    }
    for (const c of clubs) {
      out.push({
        type: "club",
        id: c.id as string,
        interestTags: (c.interestTags as string | null) ?? null,
        themeSlug: c.themeSlug as string,
        latitude: (c.latitude as string | null) ?? null,
        longitude: (c.longitude as string | null) ?? null,
        generalFacilitySlugs: (c.generalFacilitySlugs as string[]) ?? [],
        kidsFacilitySlugs: (c.kidsFacilitySlugs as string[]) ?? [],
        parentFacilitySlugs: (c.parentFacilitySlugs as string[]) ?? [],
        dogFacilitySlugs: [],
      });
    }
    for (const r of routes) {
      out.push({
        type: "route",
        id: r.id as string,
        interestTags: (r.interestTags as string | null) ?? null,
        themeSlug: r.themeSlug as string,
        latitude: (r.latitude as string | null) ?? null,
        longitude: (r.longitude as string | null) ?? null,
        generalFacilitySlugs: (r.generalFacilitySlugs as string[]) ?? [],
        kidsFacilitySlugs: (r.kidsFacilitySlugs as string[]) ?? [],
        parentFacilitySlugs: (r.parentFacilitySlugs as string[]) ?? [],
        dogFacilitySlugs: (r.dogFacilitySlugs as string[]) ?? [],
      });
    }

    return out;
  }
}
