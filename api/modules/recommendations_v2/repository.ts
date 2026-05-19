import type { OpportunityRecordType, Prisma } from "@prisma/client";
import prisma from "../../database/database.config.js";
import { enrichOpportunityClubV2Response } from "../opportunity/clubs_v2/helpers.js";
import { enrichOpportunityVenueV2Response } from "../opportunity/events_v2/helpers.js";
import { opportunityVenueV2Include } from "../opportunity/events_v2/types.js";
import { enrichOpportunityRouteV2Response } from "../opportunity/routes_v2/helpers.js";
import { opportunityRouteV2Include } from "../opportunity/routes_v2/types.js";
import { enrichOpportunityVenuesV2Response } from "../opportunity/venues_v2/helpers.js";
import { opportunityVenuesV2Include } from "../opportunity/venues_v2/types.js";
import { opportunityClubV2Include } from "../opportunity/clubs_v2/types.js";
import { legKey } from "./driving-leg-keys.js";
import type { RecommendationV2Candidate, RecommendationV2OpportunityPayload } from "./types.js";

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

const themeSlugSelect = { select: { slug: true } } as const;
const themeVariantSlugSelect = { select: { slug: true } } as const;

const opportunityVenuesV2CandidateSelect = {
  id: true,
  opportunityType: true,
  themeId: true,
  themeVariantId: true,
  venuePostcode: true,
  latitude: true,
  longitude: true,
  theme: themeSlugSelect,
  themeVariant: themeVariantSlugSelect,
  venueAgeSuitabilityUnder1Years: true,
  venueAgeSuitability1To2Years: true,
  venueAgeSuitability3To4Years: true,
  venueAgeSuitability5To7Years: true,
  venueAgeSuitability8To12Years: true,
  venueAgeSuitabilityOver13Years: true,
  venueAgeSuitabilityAdults: true,
} satisfies Prisma.OpportunityVenuesV2Select;

type OpportunityVenuesV2CandidateRow = Prisma.OpportunityVenuesV2GetPayload<{
  select: typeof opportunityVenuesV2CandidateSelect;
}>;

const opportunityEventsV2CandidateSelect = {
  id: true,
  opportunityType: true,
  themeId: true,
  themeVariantId: true,
  eventPostcode: true,
  latitude: true,
  longitude: true,
  theme: themeSlugSelect,
  themeVariant: themeVariantSlugSelect,
  eventAgeSuitabilityUnder1S: true,
  eventAgeSuitability1To2Years: true,
  eventAgeSuitability3To4Years: true,
  eventAgeSuitability5To7Years: true,
  eventAgeSuitability8To12Years: true,
  eventAgeSuitabilityOver13Years: true,
  eventAgeSuitabilityAdults: true,
} satisfies Prisma.OpportunityEventsV2Select;

type OpportunityEventsV2CandidateRow = Prisma.OpportunityEventsV2GetPayload<{
  select: typeof opportunityEventsV2CandidateSelect;
}>;

const opportunityClubV2CandidateSelect = {
  id: true,
  opportunityType: true,
  themeId: true,
  themeVariantId: true,
  clubPostcode: true,
  latitude: true,
  longitude: true,
  theme: themeSlugSelect,
  themeVariant: themeVariantSlugSelect,
  clubAgeSuitabilityUnder1S: true,
  clubAgeSuitability1To2Years: true,
  clubAgeSuitability3To4Years: true,
  clubAgeSuitability5To7Years: true,
  clubAgeSuitability8To12Years: true,
  clubAgeSuitabilityOver13Years: true,
  clubAgeSuitabilityAdults: true,
} satisfies Prisma.OpportunityClubV2Select;

type OpportunityClubV2CandidateRow = Prisma.OpportunityClubV2GetPayload<{
  select: typeof opportunityClubV2CandidateSelect;
}>;

const opportunityRouteV2CandidateSelect = {
  id: true,
  opportunityType: true,
  themeId: true,
  themeVariantId: true,
  routePostcode: true,
  latitude: true,
  longitude: true,
  theme: themeSlugSelect,
  themeVariant: themeVariantSlugSelect,
  routeAgeSuitabilityUnder1S: true,
  routeAgeSuitability1To2Years: true,
  routeAgeSuitability3To4Years: true,
  routeAgeSuitability5To7Years: true,
  routeAgeSuitability8To12Years: true,
  routeAgeSuitabilityOver13Years: true,
  routeAgeSuitabilityAdults: true,
} satisfies Prisma.OpportunityRouteV2Select;

type OpportunityRouteV2CandidateRow = Prisma.OpportunityRouteV2GetPayload<{
  select: typeof opportunityRouteV2CandidateSelect;
}>;

function mapVenueCandidate(row: OpportunityVenuesV2CandidateRow): RecommendationV2Candidate {
  return {
    type: row.opportunityType,
    id: row.id,
    name: "",
    description: null,
    postcode: row.venuePostcode,
    latitude: row.latitude,
    longitude: row.longitude,
    themeSlug: row.theme.slug,
    themeVariantSlug: row.themeVariant.slug,
    ageBands: {
      under1: row.venueAgeSuitabilityUnder1Years,
      ages1To2: row.venueAgeSuitability1To2Years,
      ages3To4: row.venueAgeSuitability3To4Years,
      ages5To7: row.venueAgeSuitability5To7Years,
      ages8To12: row.venueAgeSuitability8To12Years,
      over13: row.venueAgeSuitabilityOver13Years,
      adults: row.venueAgeSuitabilityAdults,
    },
    skillAreaSlug: null,
    skillAreaVariant: null,
  };
}

function mapEventCandidate(row: OpportunityEventsV2CandidateRow): RecommendationV2Candidate {
  return {
    type: row.opportunityType,
    id: row.id,
    name: "",
    description: null,
    postcode: row.eventPostcode,
    latitude: row.latitude,
    longitude: row.longitude,
    themeSlug: row.theme.slug,
    themeVariantSlug: row.themeVariant.slug,
    ageBands: {
      under1: row.eventAgeSuitabilityUnder1S,
      ages1To2: row.eventAgeSuitability1To2Years,
      ages3To4: row.eventAgeSuitability3To4Years,
      ages5To7: row.eventAgeSuitability5To7Years,
      ages8To12: row.eventAgeSuitability8To12Years,
      over13: row.eventAgeSuitabilityOver13Years,
      adults: row.eventAgeSuitabilityAdults,
    },
    skillAreaSlug: null,
    skillAreaVariant: null,
  };
}

function mapClubCandidate(row: OpportunityClubV2CandidateRow): RecommendationV2Candidate {
  return {
    type: row.opportunityType,
    id: row.id,
    name: "",
    description: null,
    postcode: row.clubPostcode,
    latitude: row.latitude,
    longitude: row.longitude,
    themeSlug: row.theme.slug,
    themeVariantSlug: row.themeVariant.slug,
    ageBands: {
      under1: row.clubAgeSuitabilityUnder1S,
      ages1To2: row.clubAgeSuitability1To2Years,
      ages3To4: row.clubAgeSuitability3To4Years,
      ages5To7: row.clubAgeSuitability5To7Years,
      ages8To12: row.clubAgeSuitability8To12Years,
      over13: row.clubAgeSuitabilityOver13Years,
      adults: row.clubAgeSuitabilityAdults,
    },
    skillAreaSlug: null,
    skillAreaVariant: null,
  };
}

function mapRouteCandidate(row: OpportunityRouteV2CandidateRow): RecommendationV2Candidate {
  return {
    type: row.opportunityType,
    id: row.id,
    name: "",
    description: null,
    postcode: row.routePostcode,
    latitude: row.latitude,
    longitude: row.longitude,
    themeSlug: row.theme.slug,
    themeVariantSlug: row.themeVariant.slug,
    ageBands: {
      under1: row.routeAgeSuitabilityUnder1S,
      ages1To2: row.routeAgeSuitability1To2Years,
      ages3To4: row.routeAgeSuitability3To4Years,
      ages5To7: row.routeAgeSuitability5To7Years,
      ages8To12: row.routeAgeSuitability8To12Years,
      over13: row.routeAgeSuitabilityOver13Years,
      adults: row.routeAgeSuitabilityAdults,
    },
    skillAreaSlug: null,
    skillAreaVariant: null,
  };
}

export class RecommendationsV2Repository {
  getParentForRecommendations(parentId: string, childId?: string) {
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

  async getOpportunityCandidatesV2(): Promise<RecommendationV2Candidate[]> {
    const [venues, events, clubs, routes] = await Promise.all([
      prisma.opportunityVenuesV2.findMany({
        select: opportunityVenuesV2CandidateSelect,
      }),
      prisma.opportunityEventsV2.findMany({
        select: opportunityEventsV2CandidateSelect,
      }),
      prisma.opportunityClubV2.findMany({
        select: opportunityClubV2CandidateSelect,
      }),
      prisma.opportunityRouteV2.findMany({
        select: opportunityRouteV2CandidateSelect,
      }),
    ]);

    return [
      ...venues.map(mapVenueCandidate),
      ...events.map(mapEventCandidate),
      ...clubs.map(mapClubCandidate),
      ...routes.map(mapRouteCandidate),
    ];
  }

  async getEnrichedOpportunityPayloadsForRecommendationsV2(
    refs: { type: OpportunityRecordType; id: string }[],
  ): Promise<Map<string, RecommendationV2OpportunityPayload>> {
    const map = new Map<string, RecommendationV2OpportunityPayload>();
    if (refs.length === 0) return map;

    const venueIds = [...new Set(refs.filter((r) => r.type === "venue").map((r) => r.id))];
    const eventIds = [...new Set(refs.filter((r) => r.type === "event").map((r) => r.id))];
    const clubIds = [...new Set(refs.filter((r) => r.type === "club").map((r) => r.id))];
    const routeIds = [...new Set(refs.filter((r) => r.type === "route").map((r) => r.id))];

    const [venueRows, eventRows, clubRows, routeRows] = await Promise.all([
      venueIds.length > 0
        ? prisma.opportunityVenuesV2.findMany({
            where: { id: { in: venueIds } },
            include: opportunityVenuesV2Include,
          })
        : Promise.resolve([]),
      eventIds.length > 0
        ? prisma.opportunityEventsV2.findMany({
            where: { id: { in: eventIds } },
            include: opportunityVenueV2Include,
          })
        : Promise.resolve([]),
      clubIds.length > 0
        ? prisma.opportunityClubV2.findMany({
            where: { id: { in: clubIds } },
            include: opportunityClubV2Include,
          })
        : Promise.resolve([]),
      routeIds.length > 0
        ? prisma.opportunityRouteV2.findMany({
            where: { id: { in: routeIds } },
            include: opportunityRouteV2Include,
          })
        : Promise.resolve([]),
    ]);

    for (const row of venueRows) {
      map.set(legKey("venue", row.id), enrichOpportunityVenuesV2Response(row));
    }
    for (const row of eventRows) {
      map.set(legKey("event", row.id), enrichOpportunityVenueV2Response(row));
    }
    for (const row of clubRows) {
      map.set(legKey("club", row.id), enrichOpportunityClubV2Response(row));
    }
    for (const row of routeRows) {
      map.set(legKey("route", row.id), enrichOpportunityRouteV2Response(row));
    }

    return map;
  }
}
