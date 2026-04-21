import { Prisma, type OpportunityRecordType } from "@prisma/client";
import prisma from "../../database/database.config.js";
import type { OpportunitySearchCandidateRow, OpportunitySearchDrivingLegRow } from "./types.js";

const METERS_PER_MILE = 1609.344;

export function maxDrivingDistanceMetersFromMiles(maxDistanceMiles: number): number {
  return Math.floor(maxDistanceMiles * METERS_PER_MILE);
}

export class OpportunitySearchRepository {
  async findFacilityBySlug(slug: string): Promise<{ slug: string } | null> {
    const normalized = slug.trim().toLowerCase();
    if (!normalized) return null;
    return prisma.facility.findUnique({
      where: { slug: normalized },
      select: { slug: true },
    });
  }

  async findChildInterestSubCategorySlugs(
    parentId: string,
    childId: string,
  ): Promise<string[] | null> {
    const row = await prisma.children.findFirst({
      where: { id: childId, parentId },
      select: {
        interestSubCategories: { select: { slug: true } },
      },
    });
    if (!row) return null;
    return row.interestSubCategories.map((s) => s.slug);
  }

  async findParentLatLon(parentId: string): Promise<{ latitude: string; longitude: string } | null> {
    const row = await prisma.parents.findUnique({
      where: { id: parentId },
      select: { latitude: true, longitude: true },
    });
    if (!row) return null;
    return { latitude: row.latitude, longitude: row.longitude };
  }

  async listDrivingLegsForParent(
    parentId: string,
    opts: {
      maxDurationSeconds?: number;
      maxDistanceMeters?: number;
    },
  ): Promise<OpportunitySearchDrivingLegRow[]> {
    const where: Prisma.ParentOpportunityDrivingLegWhereInput = { parentId };
    if (opts.maxDurationSeconds != null) {
      where.drivingDurationSeconds = { lte: opts.maxDurationSeconds };
    }
    if (opts.maxDistanceMeters != null) {
      where.drivingDistanceMeters = { lte: opts.maxDistanceMeters };
    }
    return prisma.parentOpportunityDrivingLeg.findMany({
      where,
      select: {
        opportunityType: true,
        opportunityId: true,
        drivingDistanceMeters: true,
        drivingDurationSeconds: true,
        parentLatitude: true,
        parentLongitude: true,
        opportunityLatitude: true,
        opportunityLongitude: true,
      },
    });
  }

  async findCandidatesByRefs(
    refs: { type: OpportunityRecordType; id: string }[],
  ): Promise<OpportunitySearchCandidateRow[]> {
    if (refs.length === 0) return [];

    const venueIds = [...new Set(refs.filter((r) => r.type === "venue").map((r) => r.id))];
    const eventIds = [...new Set(refs.filter((r) => r.type === "event").map((r) => r.id))];
    const clubIds = [...new Set(refs.filter((r) => r.type === "club").map((r) => r.id))];
    const routeIds = [...new Set(refs.filter((r) => r.type === "route").map((r) => r.id))];

    const [venueDogById, venues, events, clubs, routes] = await Promise.all([
      venueIds.length
        ? prisma
            .$queryRaw<{ id: string; dogFacilitySlugs: string[] | null }[]>`
            SELECT id, "dogFacilitySlugs"
            FROM "opportunity_venues"
            WHERE id IN (${Prisma.join(venueIds)})
          `
            .then((rows) => {
              const m = new Map<string, string[]>();
              for (const r of rows) {
                m.set(r.id, r.dogFacilitySlugs ?? []);
              }
              return m;
            })
        : Promise.resolve(new Map<string, string[]>()),
      venueIds.length
        ? prisma.opportunityVenue.findMany({
            where: { id: { in: venueIds } },
            select: {
              id: true,
              type: true,
              interestTags: true,
              themeSlug: true,
              latitude: true,
              longitude: true,
              generalFacilitySlugs: true,
              kidsFacilitySlugs: true,
              parentFacilitySlugs: true,
            },
          })
        : Promise.resolve([]),
      eventIds.length
        ? prisma.opportunityEvent.findMany({
            where: { id: { in: eventIds } },
            select: {
              id: true,
              type: true,
              interestTags: true,
              themeSlug: true,
              latitude: true,
              longitude: true,
              generalFacilitySlugs: true,
              kidsFacilitySlugs: true,
              parentFacilitySlugs: true,
            },
          })
        : Promise.resolve([]),
      clubIds.length
        ? prisma.opportunityClub.findMany({
            where: { id: { in: clubIds } },
            select: {
              id: true,
              type: true,
              interestTags: true,
              themeSlug: true,
              latitude: true,
              longitude: true,
              generalFacilitySlugs: true,
              kidsFacilitySlugs: true,
              parentFacilitySlugs: true,
            },
          })
        : Promise.resolve([]),
      routeIds.length
        ? prisma.opportunityRoute.findMany({
            where: { id: { in: routeIds } },
            select: {
              id: true,
              type: true,
              interestTags: true,
              themeSlug: true,
              latitude: true,
              longitude: true,
              generalFacilitySlugs: true,
              kidsFacilitySlugs: true,
              parentFacilitySlugs: true,
              dogFacilitySlugs: true,
            },
          })
        : Promise.resolve([]),
    ]);

    const out: OpportunitySearchCandidateRow[] = [];
    for (const v of venues) {
      out.push({
        type: v.type,
        id: v.id,
        interestTags: v.interestTags,
        themeSlug: v.themeSlug,
        latitude: v.latitude,
        longitude: v.longitude,
        generalFacilitySlugs: v.generalFacilitySlugs,
        kidsFacilitySlugs: v.kidsFacilitySlugs,
        parentFacilitySlugs: v.parentFacilitySlugs,
        dogFacilitySlugs: venueDogById.get(v.id) ?? [],
      });
    }
    for (const e of events) {
      out.push({
        type: e.type,
        id: e.id,
        interestTags: e.interestTags,
        themeSlug: e.themeSlug,
        latitude: e.latitude,
        longitude: e.longitude,
        generalFacilitySlugs: e.generalFacilitySlugs,
        kidsFacilitySlugs: e.kidsFacilitySlugs,
        parentFacilitySlugs: e.parentFacilitySlugs,
        dogFacilitySlugs: [],
      });
    }
    for (const c of clubs) {
      out.push({
        type: c.type,
        id: c.id,
        interestTags: c.interestTags,
        themeSlug: c.themeSlug,
        latitude: c.latitude,
        longitude: c.longitude,
        generalFacilitySlugs: c.generalFacilitySlugs,
        kidsFacilitySlugs: c.kidsFacilitySlugs,
        parentFacilitySlugs: c.parentFacilitySlugs,
        dogFacilitySlugs: [],
      });
    }
    for (const r of routes) {
      out.push({
        type: r.type,
        id: r.id,
        interestTags: r.interestTags,
        themeSlug: r.themeSlug,
        latitude: r.latitude,
        longitude: r.longitude,
        generalFacilitySlugs: r.generalFacilitySlugs,
        kidsFacilitySlugs: r.kidsFacilitySlugs,
        parentFacilitySlugs: r.parentFacilitySlugs,
        dogFacilitySlugs: r.dogFacilitySlugs,
      });
    }
    return out;
  }
}
