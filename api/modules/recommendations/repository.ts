import type { OpportunityRecordType } from "@prisma/client";
import prisma from "../../database/database.config.js";
import { enrichOpportunityClubResponse } from "../opportunity/clubs/helpers.js";
import { enrichOpportunityEventResponse } from "../opportunity/events/helpers.js";
import { enrichOpportunityRouteResponse } from "../opportunity/routes/helpers.js";
import { enrichOpportunityVenueResponse } from "../opportunity/venues/helpers.js";
import { legKey } from "./driving-leg.repository.js";
import type { RecommendationCandidate, RecommendationOpportunityPayload } from "./types.js";

const categorySlugSelect = { slug: true } as const;
const subCategorySlugSelect = { slug: true } as const;

const skillSubCategorySlugSelect = { slug: true } as const;
const childrenInclude = {
  include: {
    interestCategories: { select: categorySlugSelect },
    interestSubCategories: { select: subCategorySlugSelect },
    skills: {
      select: {
        slug: true,
        minAge: true,
        maxAge: true,
        subCategory: { select: skillSubCategorySlugSelect },
      },
    },
  },
} as const;

export class RecommendationsRepository {
  async getParentForRecommendations(parentId: string, childId?: string) {
    return prisma.parents.findUnique({
      where: { id: parentId },
      include: {
        interestCategories: { select: categorySlugSelect },
        interestSubCategories: { select: subCategorySlugSelect },
        children: childId
          ? { where: { id: childId }, ...childrenInclude }
          : { ...childrenInclude },
      },
    });
  }

  async getOpportunityCandidates(): Promise<RecommendationCandidate[]> {
    const [venues, events, clubs, routes] = await Promise.all([
      prisma.opportunityVenue.findMany({
        select: {
          id: true,
          type: true,
          name: true,
          description: true,
          postCode: true,
          latitude: true,
          longitude: true,
          venuePostcode: true,
          interestTags: true,
          themeSlug: true,
          ageSuitabilitySlugs: true,
        },
      }),
      prisma.opportunityEvent.findMany({
        select: {
          id: true,
          type: true,
          name: true,
          description: true,
          postCode: true,
          latitude: true,
          longitude: true,
          venuePostCode: true,
          interestTags: true,
          themeSlug: true,
          ageSuitabilitySlugs: true,
          skillAreaSlug: true,
          skillAreaVariant: true,
        },
      }),
      prisma.opportunityClub.findMany({
        select: {
          id: true,
          type: true,
          name: true,
          description: true,
          postCode: true,
          latitude: true,
          longitude: true,
          venuePostCode: true,
          interestTags: true,
          themeSlug: true,
          ageSuitabilitySlugs: true,
          skillAreaSlug: true,
          skillAreaVariant: true,
        },
      }),
      prisma.opportunityRoute.findMany({
        select: {
          id: true,
          type: true,
          name: true,
          description: true,
          postCode: true,
          latitude: true,
          longitude: true,
          startPointPostCode: true,
          interestTags: true,
          themeSlug: true,
        },
      }),
    ]);

    const venueRows: RecommendationCandidate[] = venues.map((v) => ({
      type: v.type,
      id: v.id,
      name: v.name,
      description: v.description,
      postcode: v.postCode ?? v.venuePostcode,
      latitude: v.latitude,
      longitude: v.longitude,
      interestTags: v.interestTags,
      themeSlug: v.themeSlug,
      ageSuitabilitySlugs: v.ageSuitabilitySlugs,
      skillAreaSlug: null,
      skillAreaVariant: null,
    }));

    const eventRows: RecommendationCandidate[] = events.map((e) => ({
      type: e.type,
      id: e.id,
      name: e.name,
      description: e.description,
      postcode: e.postCode ?? e.venuePostCode,
      latitude: e.latitude,
      longitude: e.longitude,
      interestTags: e.interestTags,
      themeSlug: e.themeSlug,
      ageSuitabilitySlugs: e.ageSuitabilitySlugs,
      skillAreaSlug: e.skillAreaSlug,
      skillAreaVariant: e.skillAreaVariant,
    }));

    const clubRows: RecommendationCandidate[] = clubs.map((c) => ({
      type: c.type,
      id: c.id,
      name: c.name,
      description: c.description,
      postcode: c.postCode ?? c.venuePostCode,
      latitude: c.latitude,
      longitude: c.longitude,
      interestTags: c.interestTags,
      themeSlug: c.themeSlug,
      ageSuitabilitySlugs: c.ageSuitabilitySlugs,
      skillAreaSlug: c.skillAreaSlug,
      skillAreaVariant: c.skillAreaVariant,
    }));

    const routeRows: RecommendationCandidate[] = routes.map((r) => ({
      type: r.type,
      id: r.id,
      name: r.name,
      description: r.description,
      postcode: r.postCode ?? r.startPointPostCode,
      latitude: r.latitude,
      longitude: r.longitude,
      interestTags: r.interestTags,
      themeSlug: r.themeSlug,
      /// Schema has no age suitability on routes; treat as all ages.
      ageSuitabilitySlugs: [],
      skillAreaSlug: null,
      skillAreaVariant: null,
    }));

    return [...venueRows, ...eventRows, ...clubRows, ...routeRows];
  }

  /**
   * Full opportunity rows in the same shape as venue/event/club/route `getById` responses
   * (slug → label enrichment), for merging into recommendation list items.
   */
  async getEnrichedOpportunityPayloadsForRecommendations(
    refs: { type: OpportunityRecordType; id: string }[],
  ): Promise<Map<string, RecommendationOpportunityPayload>> {
    const map = new Map<string, RecommendationOpportunityPayload>();
    if (refs.length === 0) return map;

    const venueIds = [...new Set(refs.filter((r) => r.type === "venue").map((r) => r.id))];
    const eventIds = [...new Set(refs.filter((r) => r.type === "event").map((r) => r.id))];
    const clubIds = [...new Set(refs.filter((r) => r.type === "club").map((r) => r.id))];
    const routeIds = [...new Set(refs.filter((r) => r.type === "route").map((r) => r.id))];

    const [venueRows, eventRows, clubRows, routeRows] = await Promise.all([
      venueIds.length > 0
        ? prisma.opportunityVenue.findMany({ where: { id: { in: venueIds } } })
        : Promise.resolve([]),
      eventIds.length > 0
        ? prisma.opportunityEvent.findMany({ where: { id: { in: eventIds } } })
        : Promise.resolve([]),
      clubIds.length > 0
        ? prisma.opportunityClub.findMany({ where: { id: { in: clubIds } } })
        : Promise.resolve([]),
      routeIds.length > 0
        ? prisma.opportunityRoute.findMany({ where: { id: { in: routeIds } } })
        : Promise.resolve([]),
    ]);

    for (const row of venueRows) {
      map.set(legKey("venue", row.id), enrichOpportunityVenueResponse(row));
    }
    for (const row of eventRows) {
      map.set(legKey("event", row.id), enrichOpportunityEventResponse(row));
    }
    for (const row of clubRows) {
      map.set(legKey("club", row.id), enrichOpportunityClubResponse(row));
    }
    for (const row of routeRows) {
      map.set(legKey("route", row.id), enrichOpportunityRouteResponse(row));
    }

    return map;
  }
}
