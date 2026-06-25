import type {
  OpportunityVenueV2,
  OpportunityEventV2,
  OpportunityClubV2,
  OpportunityRouteV2,
} from "../../types/opportunity-v2.types";
import type { OppType } from "../../types/opportunity-detail.types";
import { buildImageUrl } from "./image-url";
import { buildScheduleInfo as buildClubScheduleInfo } from "./club-to-opportunity";
import { buildScheduleInfo as buildEventScheduleInfo } from "./event-to-opportunity";

/** Scored recommendation row enriched with full opportunity payload. */
export interface EnrichedScoredRecommendationV2 extends Record<string, unknown> {
  id:                    string;
  opportunityType:       string;
  image?:                string | null;
  latitude?:             string | null;
  longitude?:            string | null;
  distanceMiles?:        number | null;
  drivingDistanceMiles?: number | null;
  drivingDurationSeconds?: number | null;
}

export interface Opportunity {
  id:          string;
  type:        OppType;
  title:       string;
  image:       any;
  duration:    string;
  tags:        string[];
  price:       string;
  travelTime:  string;
  isFavorite?: boolean;
  icons?:      string[];
  priceValue?: number;
  distanceKm?: number;
  durationMin?:number;
  description?:string;
  amenitiesForThem?: { icon: string; label: string }[];
  amenitiesForYou?:  { icon: string; label: string }[];
  location?: { latitude: string | null; longitude: string | null } | null;
}



// ── Icon map for facility labels ─────────────────────────────────────────────

const FACILITY_ICON_MAP: Record<string, string> = {
  "hot drinks": "coffee",
  "hot & cold food": "restaurant",
  "snacks": "snack_bar",
  "toilets": "wc",
  "disabled toilets": "accessible",
  "baby changing": "child_care",
  "showers / changing facilities": "shower",
  "bench seating": "chair",
  "picnic benches": "outdoor_dining",
  "indoor seating": "weekend",
  "outdoor seating": "deck",
  "wifi": "wifi",
  "play equipment": "toys",
  "activity trail": "hiking",
  "children's trail": "hiking",
  "activity sheets": "description",
  "clues / games": "extension",
  "indoor games (puzzles, boards)": "casino",
  "colouring": "brush",
  "ice creams": "icecream",
  "treasure hunt": "search",
  "comfy seating / sofas": "weekend",
  "sunloungers": "beach_access",
  "clear sightlines": "visibility",
  "drinks stand": "local_cafe",
  "sweet treats": "cake",
  "log burner": "local_fire_department",
  "outdoor terrace": "balcony",
  "poo bins": "delete",
  "dog wash": "pets",
  "dogs on leads": "pets",
};

function facilityIcon(label: string): string {
  return FACILITY_ICON_MAP[label.toLowerCase()] ?? "star";
}

// ── Field resolvers ───────────────────────────────────────────────────────────

function resolveName(rec: EnrichedScoredRecommendationV2): string {
  switch (rec.opportunityType) {
    case "venue": return (rec as unknown as OpportunityVenueV2).venueName;
    case "event": return (rec as unknown as OpportunityEventV2).eventName;
    case "club":  return (rec as unknown as OpportunityClubV2).clubName;
    case "route": return (rec as unknown as OpportunityRouteV2).routeName;
    default:      return "";
  }
}

function resolveDescription(rec: EnrichedScoredRecommendationV2): string | undefined {
  switch (rec.opportunityType) {
    case "venue": return (rec as unknown as OpportunityVenueV2).venueDescription ?? undefined;
    case "event": return (rec as unknown as OpportunityEventV2).eventDescription ?? undefined;
    case "club":  return (rec as unknown as OpportunityClubV2).clubDescription ?? undefined;
    case "route": return (rec as unknown as OpportunityRouteV2).routeDescription ?? undefined;
    default:      return undefined;
  }
}

function resolveDuration(rec: EnrichedScoredRecommendationV2): string {
  switch (rec.opportunityType) {
    case "venue": return (rec as unknown as OpportunityVenueV2).venueEstimatedDuration ?? "";
    case "route": return (rec as unknown as OpportunityRouteV2).routeEstimatedDuration ?? "";
    case "club": {
      const schedule = buildClubScheduleInfo(rec as unknown as OpportunityClubV2);
      return schedule ? `${schedule.title} · ${schedule.subtitle}` : "";
    }
    case "event": {
      const schedule = buildEventScheduleInfo(rec as unknown as OpportunityEventV2);
      return schedule ? `${schedule.title} · ${schedule.subtitle}` : "";
    }
    default: return "";
  }
}

function resolveTags(rec: EnrichedScoredRecommendationV2): string[] {
  let raw: string | null = null;
  switch (rec.opportunityType) {
    case "venue": raw = (rec as unknown as OpportunityVenueV2).venueInterestTags; break;
    case "event": raw = (rec as unknown as OpportunityEventV2).eventInterestTags; break;
    case "club":  raw = (rec as unknown as OpportunityClubV2).clubInterestTags; break;
    case "route": raw = (rec as unknown as OpportunityRouteV2).routeInterestTags; break;
  }
  if (!raw) return [];
  return raw.split(",").map((t) => t.trim()).filter(Boolean);
}

function parseNumericPrice(raw: string | null | undefined): number | undefined {
  if (!raw) return undefined;
  const num = parseFloat(raw.replace(/[^0-9.]/g, ""));
  return isNaN(num) ? undefined : num;
}

function resolvePrice(rec: EnrichedScoredRecommendationV2): { price: string; priceValue: number | undefined } {
  switch (rec.opportunityType) {
    case "route":
      return { price: "Free", priceValue: 0 };

    case "venue": {
      const venue = rec as unknown as OpportunityVenueV2;
      if (venue.venueEntryCost === false) return { price: "Free", priceValue: 0 };
      const raw = venue.ticketVariantAdultPrice ?? venue.ticketVariantOlderChildPrice ?? venue.ticketVariantBabyPrice;
      if (!raw) return { price: "Free", priceValue: 0 };
      return { price: `From ${raw}`, priceValue: parseNumericPrice(raw) };
    }

    case "event": {
      const event = rec as unknown as OpportunityEventV2;
      if (event.eventEntryCost === false) return { price: "Free", priceValue: 0 };
      const raw = event.ticketVariantAdultPrice ?? event.ticketVariantOlderChildPrice ?? event.ticketVariantBabyPrice;
      if (!raw) return { price: "Free", priceValue: 0 };
      return { price: `From ${raw}`, priceValue: parseNumericPrice(raw) };
    }

    case "club": {
      const club = rec as unknown as OpportunityClubV2;
      if (club.ticketingRequirement === false) return { price: "Free", priceValue: 0 };
      const raw = club.ticketVariantAdultPrice ?? club.ticketVariantOlderChildPrice ?? club.ticketVariantBabyPrice;
      if (!raw) return { price: "Free", priceValue: 0 };
      return { price: `From ${raw}`, priceValue: parseNumericPrice(raw) };
    }

    default:
      return { price: "Free", priceValue: 0 };
  }
}

function resolveChildFacilities(rec: EnrichedScoredRecommendationV2): string | null {
  switch (rec.opportunityType) {
    case "venue": return (rec as unknown as OpportunityVenueV2).venueChildFacilities;
    case "event": return (rec as unknown as OpportunityEventV2).eventChildFacilities;
    case "club":  return (rec as unknown as OpportunityClubV2).clubChildFacilities;
    case "route": return (rec as unknown as OpportunityRouteV2).routeChildFacilities;
    default:      return null;
  }
}

function resolveAdultFacilities(rec: EnrichedScoredRecommendationV2): string | null {
  switch (rec.opportunityType) {
    case "venue": return (rec as unknown as OpportunityVenueV2).venueAdultFacilities;
    case "event": return (rec as unknown as OpportunityEventV2).eventAdultFacilities;
    case "club":  return (rec as unknown as OpportunityClubV2).clubAdultFacilities;
    case "route": return (rec as unknown as OpportunityRouteV2).routeAdultFacilities;
    default:      return null;
  }
}

function parseAmenities(raw: string | null): { icon: string; label: string }[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((f) => f.trim())
    .filter(Boolean)
    .map((label) => ({ icon: facilityIcon(label), label }));
}

function formatTravelTime(seconds: number | null): string {
  if (!seconds) return "";
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem > 0 ? `${hours}h ${rem}min` : `${hours}h`;
}

const MILES_TO_KM = 1.60934;

// ── Main formatter ────────────────────────────────────────────────────────────

export function toOpportunity(rec: EnrichedScoredRecommendationV2): Opportunity {
  const { price, priceValue } = resolvePrice(rec);
  const distanceKm = rec.distanceMiles != null
    ? parseFloat((rec.distanceMiles * MILES_TO_KM).toFixed(1))
    : undefined;
  const durationMin = rec.drivingDurationSeconds != null
    ? Math.round(rec.drivingDurationSeconds / 60)
    : undefined;

  const description = resolveDescription(rec);

  return {
    id: rec.id,
    type: rec.opportunityType as OppType,
    title: resolveName(rec),
    image: { uri: rec.image ? buildImageUrl(rec.image, rec.opportunityType) : undefined },
  //  image: (rec as unknown as { image?: string | null }).image? buildImageUrl(rec.image) : null,
    //image: (rec as unknown as { image?: string | null }).image ?? null,
    //image: { uri: `https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=250&auto=format&fit=crop` },
    // duration: resolveDuration(rec),
    duration: "",
    tags: resolveTags(rec),
    price,
    travelTime: formatTravelTime(rec.drivingDurationSeconds ?? null),
    isFavorite: false,
    ...(priceValue !== undefined && { priceValue }),
    ...(distanceKm !== undefined && { distanceKm }),
    ...(durationMin !== undefined && { durationMin }),
    ...(description !== undefined && { description }),
    amenitiesForThem: parseAmenities(resolveChildFacilities(rec)),
    amenitiesForYou: parseAmenities(resolveAdultFacilities(rec)),
    location: rec.latitude !== undefined && rec.longitude !== undefined
      ? { latitude: rec.latitude, longitude: rec.longitude }
      : null,
  };
}

export function toOpportunityList(data: EnrichedScoredRecommendationV2[]): Opportunity[] {
  return data.map(toOpportunity);
}
