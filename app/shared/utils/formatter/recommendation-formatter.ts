import type {
  OpportunityVenueV2,
  OpportunityEventV2,
  OpportunityClubV2,
  OpportunityRouteV2,
  ThemeRef,
  ThemeVariantRef,
} from "../../types/opportunity-v2.types";
import type { OppType } from "../../types/opportunity-detail.types";
import { buildImageUrl } from "./image-url";
import { buildScheduleInfo as buildClubScheduleInfo } from "./club-to-opportunity";
import { buildScheduleInfo as buildEventScheduleInfo } from "./event-to-opportunity";
import { resolveCardPrice } from "./pricing";
import { toSlugName, toSlugNameList, type SlugName } from "../slug-name";

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
  themeSlug?:            string;
  themeVariantSlug?:     string;
}

// A single line of card text, plus whether it's the journey/travel-time line
// (frontend prefixes those with a Navigation icon).
export interface CardDisplayLines {
  line1?: string;
  line2?: string;
  line3?: string;
  line2IsJourney?: boolean;
  line3IsJourney?: boolean;
  routeDurationInline?: string; // route only — rendered after line1 with a footprints icon
}

// Pre-composed card text per size class, so the frontend just picks
// `compact` (small cards) or `full` (medium/large) and renders — it does not
// re-derive which fields go where. Mirrors nativeapp-main-loveable's
// src/components/cards/OpportunityCard.tsx getCardDetails() exactly, but
// computed once here instead of duplicated client-side.
export interface CardDisplay {
  compact: CardDisplayLines;
  full: CardDisplayLines;
}

export interface Opportunity {
  id:          string;
  type:        OppType;
  title:       string;
  image:       string;
  duration:    string;
  tags:        string[];
  activityGroup: SlugName[] | null;
  theme:       ThemeRef | null;
  themeVariant: ThemeVariantRef | null;
  price:       string;
  travelTime:  string;
  isFavorite?: boolean;
  icons?:      string[];
  priceValue?: number;
  distanceKm?: number;
  durationMin?:number;
  description?:string;
  amenitiesForThem?: { icon: string; label: SlugName }[];
  amenitiesForYou?:  { icon: string; label: SlugName }[];
  location?: { latitude: string | null; longitude: string | null } | null;
  // Pre-composed per-size card text (see CardDisplay above).
  cardDisplay: CardDisplay;
  // Suitability icon keys (Buggies/Dogs/Scooters/Bikes/Wheelchairs/Carriers)
  // — kept raw (not composed into cardDisplay) because the frontend maps
  // these to actual icon components; route only, see resolveRouteSuitability().
  routeSuitability?: string[];
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
    case "venue": return toSlugNameList((rec as unknown as OpportunityVenueV2).venueEstimatedDuration)?.map((e) => e.name).join(", ") ?? "";
    case "route": return toSlugNameList((rec as unknown as OpportunityRouteV2).routeEstimatedDuration)?.map((e) => e.name).join(", ") ?? "";
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

function resolveActivityGroup(rec: EnrichedScoredRecommendationV2): SlugName[] | null {
  let raw: string | null = null;
  switch (rec.opportunityType) {
    case "venue": raw = (rec as unknown as OpportunityVenueV2).venueActivityGroup; break;
    case "event": raw = (rec as unknown as OpportunityEventV2).eventActivityGroup; break;
    case "club":  raw = (rec as unknown as OpportunityClubV2).clubActivityGroup; break;
    case "route": raw = (rec as unknown as OpportunityRouteV2).routeActivityGrouping; break;
    default:      raw = null;
  }
  return toSlugNameList(raw) ?? [];
}

// `themeSlug`/`themeVariantSlug` on raw recommendation rows are enum slugs
// (possibly comma-joined for multi-value themes) — resolve every slug to its
// human-readable name via the combined enum lookup instead of showing the slug.
function resolveTheme(rec: EnrichedScoredRecommendationV2): ThemeRef | null {
  const slug = rec.themeSlug;
  if (!slug) return null;
  const name = toSlugNameList(slug)?.map((e) => e.name).join(", ") ?? slug;
  return { id: slug, slug, name, recordType: rec.opportunityType };
}

function resolveThemeVariant(rec: EnrichedScoredRecommendationV2): ThemeVariantRef | null {
  const slug = rec.themeVariantSlug;
  if (!slug) return null;
  const name = toSlugNameList(slug)?.map((e) => e.name).join(", ") ?? slug;
  return { id: slug, slug, name };
}

function resolvePrice(rec: EnrichedScoredRecommendationV2): { price: string; priceValue: number | undefined } {
  switch (rec.opportunityType) {
    case "route":
      return { price: "Free", priceValue: 0 };

    case "venue": {
      const venue = rec as unknown as OpportunityVenueV2;
      return resolveCardPrice(
        venue.venueEntryCost === true,
        venue.ticketVariantAdultPrice,
        venue.ticketVariantOlderChildPrice,
        venue.ticketVariantBabyPrice,
      );
    }

    case "event": {
      const event = rec as unknown as OpportunityEventV2;
      return resolveCardPrice(
        event.eventEntryCost === true,
        event.ticketVariantAdultPrice,
        event.ticketVariantOlderChildPrice,
        event.ticketVariantBabyPrice,
      );
    }

    case "club": {
      const club = rec as unknown as OpportunityClubV2;
      return resolveCardPrice(
        club.ticketingRequirement === true,
        club.ticketVariantAdultPrice,
        club.ticketVariantOlderChildPrice,
        club.ticketVariantBabyPrice,
      );
    }

    default:
      return { price: "Free", priceValue: 0 };
  }
}

function resolveChildFacilities(rec: EnrichedScoredRecommendationV2): SlugName[] | null {
  let raw: string | null = null;
  switch (rec.opportunityType) {
    case "venue": raw = (rec as unknown as OpportunityVenueV2).venueChildFacilities; break;
    case "event": raw = (rec as unknown as OpportunityEventV2).eventChildFacilities; break;
    case "club":  raw = (rec as unknown as OpportunityClubV2).clubChildFacilities; break;
    case "route": raw = (rec as unknown as OpportunityRouteV2).routeChildFacilities; break;
  }
  return toSlugNameList(raw);
}

function resolveAdultFacilities(rec: EnrichedScoredRecommendationV2): SlugName[] | null {
  let raw: string | null = null;
  switch (rec.opportunityType) {
    case "venue": raw = (rec as unknown as OpportunityVenueV2).venueAdultFacilities; break;
    case "event": raw = (rec as unknown as OpportunityEventV2).eventAdultFacilities; break;
    case "club":  raw = (rec as unknown as OpportunityClubV2).clubAdultFacilities; break;
    case "route": raw = (rec as unknown as OpportunityRouteV2).routeAdultFacilities; break;
  }
  return toSlugNameList(raw);
}

// ── Card-display field resolvers (nativeapp-main-loveable OpportunityCard.tsx parity) ──

function resolveBookingType(rec: EnrichedScoredRecommendationV2): string | null {
  if (rec.opportunityType !== "venue") return null;
  return toSlugNameList((rec as unknown as OpportunityVenueV2).venueBookingType)?.map((e) => e.name).join(", ") ?? null;
}

function resolveRouteType(rec: EnrichedScoredRecommendationV2): string | null {
  if (rec.opportunityType !== "route") return null;
  return toSlugNameList((rec as unknown as OpportunityRouteV2).routeType)?.map((e) => e.name).join(", ") ?? null;
}

// Route suitability (Buggies/Dogs/Scooters/Bikes/Wheelchairs/Carriers, matching
// Lovable's SuitabilityIcons keys exactly) has no dedicated backend field —
// OpportunityRouteV2 only has free-text facility/kit/attraction fields. Derive
// a best-effort signal via keyword matching over the fields that actually
// mention this (routeExtraKit, routeAttractions, routeGeneralFacilities,
// routeDogFacilities) rather than leaving it permanently empty.
const ROUTE_SUITABILITY_KEYWORDS: Record<string, string[]> = {
  Buggies: ["buggy", "pushchair", "stroller"],
  Dogs: ["dog"],
  Scooters: ["scooter"],
  Bikes: ["bike", "cycl"],
  Wheelchairs: ["wheelchair"],
  Carriers: ["carrier", "sling"],
};

export function resolveRouteSuitability(rec: EnrichedScoredRecommendationV2): string[] {
  if (rec.opportunityType !== "route") return [];
  const route = rec as unknown as OpportunityRouteV2;
  const haystack = [
    route.routeExtraKit,
    route.routeAttractions,
    route.routeGeneralFacilities,
    route.routeDogFacilities,
    route.routeChildFacilities,
    route.routeAdultFacilities,
  ].filter(Boolean).join(", ").toLowerCase();
  if (!haystack) return [];
  return Object.entries(ROUTE_SUITABILITY_KEYWORDS)
    .filter(([, keywords]) => keywords.some((kw) => haystack.includes(kw)))
    .map(([key]) => key);
}

function resolveClubFrequency(rec: EnrichedScoredRecommendationV2): string | null {
  if (rec.opportunityType !== "club") return null;
  const raw = (rec as unknown as OpportunityClubV2).clubFrequency;
  return raw ? toSlugName(raw).name : null;
}

function resolveClubCommitment(rec: EnrichedScoredRecommendationV2): string | null {
  if (rec.opportunityType !== "club") return null;
  const raw = (rec as unknown as OpportunityClubV2).clubCommittment;
  return raw ? toSlugName(raw).name : null;
}

function resolveClubFormat(rec: EnrichedScoredRecommendationV2): string | null {
  if (rec.opportunityType !== "club") return null;
  const raw = (rec as unknown as OpportunityClubV2).clubFormat;
  return raw ? toSlugName(raw).name : null;
}

function resolveClubSkillArea(rec: EnrichedScoredRecommendationV2): string | null {
  if (rec.opportunityType !== "club") return null;
  return toSlugNameList((rec as unknown as OpportunityClubV2).clubSkillArea)?.map((e) => e.name).join(", ") ?? null;
}

function resolveRequiresBooking(rec: EnrichedScoredRecommendationV2): boolean {
  if (rec.opportunityType === "club") return (rec as unknown as OpportunityClubV2).ticketingRequirement === true;
  if (rec.opportunityType === "event") return (rec as unknown as OpportunityEventV2).ticketingRequirement === true;
  return false;
}

function resolveEventType(rec: EnrichedScoredRecommendationV2): string | null {
  if (rec.opportunityType !== "event") return null;
  const raw = (rec as unknown as OpportunityEventV2).eventType;
  return raw ? toSlugName(raw).name : null;
}

// ── Card display composition (nativeapp-main-loveable OpportunityCard.tsx parity) ──
//
// Ported from getCardDetails()/compactDuration() in
// nativeapp-main-loveable/src/components/cards/OpportunityCard.tsx. This is
// presentation-layer decision logic (which field goes on which line, in what
// order, with what formatting) — computed once here so every client renders
// identical card text instead of each frontend re-implementing the same
// per-type/per-size switch statement.

const CARD_LINE_SEPARATOR = "  •  ";

/**
 * Compact duration strings like "30 min - 1 hour" → "30-60 mins",
 * "1-2 hours" → "1-2 hrs".
 */
function compactDuration(duration?: string | null): string | undefined {
  if (!duration) return undefined;
  const rangeMatch = duration.match(/^(\d+(?:\.\d+)?)\s*(min(?:ute)?s?|hours?|hrs?)\s*[-–]\s*(\d+(?:\.\d+)?)\s*(min(?:ute)?s?|hours?|hrs?)$/i);
  if (rangeMatch) {
    const toMins = (val: number, unit: string) => (/hour|hr/i.test(unit) ? val * 60 : val);
    const low = toMins(parseFloat(rangeMatch[1]), rangeMatch[2]);
    const high = toMins(parseFloat(rangeMatch[3]), rangeMatch[4]);
    if (high <= 90) return `${Math.round(low)}-${Math.round(high)} mins`;
    const toHrs = (m: number) => (m % 60 === 0 ? `${m / 60}` : `${(m / 60).toFixed(1)}`);
    return `${toHrs(low)}-${toHrs(high)} hrs`;
  }
  return duration.replace(/\bhours?\b/gi, "hrs").replace(/\bminutes?\b/gi, "mins");
}

/** snake_case / kebab-case → Title Case. */
function formatCardLabel(raw?: string | null): string | undefined {
  if (!raw) return undefined;
  return raw.replace(/[_-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

interface CardDisplayInputs {
  bookingType: string | null;
  routeType: string | null;
  clubFrequency: string | null;
  clubCommitment: string | null;
  clubFormat: string | null;
  clubSkillArea: string | null;
  requiresBooking: boolean;
  eventType: string | null;
}

function resolveCardDisplay(
  type: OppType,
  duration: string,
  price: string,
  travelTime: string,
  fields: CardDisplayInputs,
): CardDisplay {
  const cost = price || "Price TBC";
  const journey = travelTime ? `~${travelTime} journey` : undefined;

  switch (type) {
    case "venue": {
      const costBooking = fields.bookingType ? fields.bookingType.toLowerCase().includes('free') ? `Free` : `${cost} (${fields.bookingType})` : cost;
      const timeLine = duration ? `Allow ${compactDuration(duration)}` : undefined;
      return {
        compact: { line1: costBooking, line2: journey, line2IsJourney: true },
        full: { line1: timeLine, line2: costBooking, line3: journey, line3IsJourney: true },
      };
    }

    case "route": {
      let routeTypeLabel = formatCardLabel(fields.routeType);
      if (routeTypeLabel === "Out And Back") routeTypeLabel = "Out-Back";
      const durationPart = duration || undefined;
      const typeDurationCompact = [routeTypeLabel, durationPart ? `(${durationPart})` : undefined].filter(Boolean).join(" ");
      return {
        compact: { line1: typeDurationCompact || undefined, line2: journey, line2IsJourney: true },
        full: {
          line1: routeTypeLabel || undefined,
          routeDurationInline: durationPart,
          line3: journey,
          line3IsJourney: true,
        },
      };
    }

    case "club": {
      const sessionSkillCompact = [duration, fields.clubSkillArea].filter(Boolean).join(CARD_LINE_SEPARATOR);
      const timeFreq = [duration, fields.clubFrequency].filter(Boolean).join(CARD_LINE_SEPARATOR);
      const bookingLabel = fields.requiresBooking ? "Book Ahead" : (fields.clubCommitment || fields.clubFormat);
      const costBooking = bookingLabel ? `${cost} (${bookingLabel})` : cost;
      return {
        compact: { line1: sessionSkillCompact || undefined, line2: journey, line2IsJourney: true },
        full: { line1: timeFreq || undefined, line2: costBooking, line3: journey, line3IsJourney: true },
      };
    }

    case "event": {
      const costStatusCompact = [cost, duration].filter(Boolean).join(CARD_LINE_SEPARATOR);
      const formattedEventType = formatCardLabel(fields.eventType);
      const costType = [cost, formattedEventType].filter(Boolean).join(CARD_LINE_SEPARATOR);
      return {
        compact: { line1: costStatusCompact || undefined, line2: journey, line2IsJourney: true },
        full: { line1: duration || undefined, line2: costType || undefined, line3: journey, line3IsJourney: true },
      };
    }
  }
}

function parseAmenities(facilities: SlugName[] | null): { icon: string; label: SlugName }[] {
  if (!facilities) return [];
  return facilities.map((label) => ({ icon: facilityIcon(label.name), label }));
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
  const type = rec.opportunityType as OppType;
  const duration = resolveDuration(rec);
  const travelTime = formatTravelTime(rec.drivingDurationSeconds ?? null);

  const cardDisplay = resolveCardDisplay(type, duration, price, travelTime, {
    bookingType: resolveBookingType(rec),
    routeType: resolveRouteType(rec),
    clubFrequency: resolveClubFrequency(rec),
    clubCommitment: resolveClubCommitment(rec),
    clubFormat: resolveClubFormat(rec),
    clubSkillArea: resolveClubSkillArea(rec),
    requiresBooking: resolveRequiresBooking(rec),
    eventType: resolveEventType(rec),
  });

  return {
    id: rec.id,
    type,
    title: resolveName(rec),
    image: buildImageUrl(rec.image, rec.opportunityType) ,
    duration,
    tags: resolveTags(rec),
    activityGroup: resolveActivityGroup(rec),
    theme: resolveTheme(rec),
    themeVariant: resolveThemeVariant(rec),
    price,
    travelTime,
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
    cardDisplay,
    routeSuitability: resolveRouteSuitability(rec),
  };
}

export function toOpportunityList(data: EnrichedScoredRecommendationV2[]): Opportunity[] {
  return data.map(toOpportunity);
}
