import type { EnrichedScoredRecommendationV2 } from "../../../modules/recommendations_v2/types.js";
import type { OpportunityVenuesV2Response } from "../../../modules/opportunity/venues_v2/types.js";
import type { OpportunityVenueV2Response } from "../../../modules/opportunity/events_v2/types.js";
import type { OpportunityClubV2Response } from "../../../modules/opportunity/clubs_v2/types.js";
import type { OpportunityRouteV2Response } from "../../../modules/opportunity/routes_v2/types.js";
import type { Opportunity, OppType } from "../../types.js";
import { buildImageUrl } from "./image-url.js";



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
    case "venue": return (rec as unknown as OpportunityVenuesV2Response).venueName;
    case "event": return (rec as unknown as OpportunityVenueV2Response).eventName;
    case "club":  return (rec as unknown as OpportunityClubV2Response).clubName;
    case "route": return (rec as unknown as OpportunityRouteV2Response).routeName;
    default:      return "";
  }
}

function resolveDescription(rec: EnrichedScoredRecommendationV2): string | undefined {
  switch (rec.opportunityType) {
    case "venue": return (rec as unknown as OpportunityVenuesV2Response).venueDescription ?? undefined;
    case "event": return (rec as unknown as OpportunityVenueV2Response).eventDescription ?? undefined;
    case "club":  return (rec as unknown as OpportunityClubV2Response).clubDescription ?? undefined;
    case "route": return (rec as unknown as OpportunityRouteV2Response).routeDescription ?? undefined;
    default:      return undefined;
  }
}

function resolveDuration(rec: EnrichedScoredRecommendationV2): string {
  switch (rec.opportunityType) {
    case "venue": return (rec as unknown as OpportunityVenuesV2Response).venueEstimatedDuration ?? "";
    case "route": return (rec as unknown as OpportunityRouteV2Response).routeEstimatedDuration ?? "";
    default:      return "";
  }
}

function resolveTags(rec: EnrichedScoredRecommendationV2): string[] {
  let raw: string | null = null;
  switch (rec.opportunityType) {
    case "venue": raw = (rec as unknown as OpportunityVenuesV2Response).venueInterestTags; break;
    case "event": raw = (rec as unknown as OpportunityVenueV2Response).eventInterestTags; break;
    case "club":  raw = (rec as unknown as OpportunityClubV2Response).clubInterestTags; break;
    case "route": raw = (rec as unknown as OpportunityRouteV2Response).routeInterestTags; break;
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
  const v = rec as unknown as Record<string, unknown>;
  const hasEntryCost = (v["venueEntryCost"] ?? v["eventEntryCost"]) as boolean | null | undefined;

  if (hasEntryCost === false) return { price: "Free", priceValue: 0 };

  const adultPrice = v["ticketVariantAdultPrice"] as string | null;
  const childPrice = v["ticketVariantOlderChildPrice"] as string | null;
  const raw = adultPrice ?? childPrice;

  if (!raw) return { price: "Free", priceValue: 0 };
  return { price: `From ${raw}`, priceValue: parseNumericPrice(raw) };
}

function resolveChildFacilities(rec: EnrichedScoredRecommendationV2): string | null {
  switch (rec.opportunityType) {
    case "venue": return (rec as unknown as OpportunityVenuesV2Response).venueChildFacilities;
    case "event": return (rec as unknown as OpportunityVenueV2Response).eventChildFacilities;
    case "club":  return (rec as unknown as OpportunityClubV2Response).clubChildFacilities;
    case "route": return (rec as unknown as OpportunityRouteV2Response).routeChildFacilities;
    default:      return null;
  }
}

function resolveAdultFacilities(rec: EnrichedScoredRecommendationV2): string | null {
  switch (rec.opportunityType) {
    case "venue": return (rec as unknown as OpportunityVenuesV2Response).venueAdultFacilities;
    case "event": return (rec as unknown as OpportunityVenueV2Response).eventAdultFacilities;
    case "club":  return (rec as unknown as OpportunityClubV2Response).clubAdultFacilities;
    case "route": return (rec as unknown as OpportunityRouteV2Response).routeAdultFacilities;
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
    duration: resolveDuration(rec),
    tags: resolveTags(rec),
    price,
    travelTime: formatTravelTime(rec.drivingDurationSeconds),
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
