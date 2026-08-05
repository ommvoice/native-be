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
import { resolveCardTotalPrice, resolveTicketPricing } from "./pricing";
import { toSlugName, toSlugNameList, type SlugName } from "../slug-name";
import { AssetsService } from "../../../services/assets.service";

const assets = new AssetsService();

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
  // Suitability slugs (buggy_friendly/dog_friendly/scooter_route/etc.)
  // — kept raw (not composed into cardDisplay) because the frontend maps
  // each slug to an icon; route only, see resolveRouteSuitability().
  routeSuitability?: SlugName[];
  // Flat slug bag for client-side search/filter matching — see resolveSearchTags().
  searchTags: SearchTags;
}

export interface SearchTags {
  interestCategory: SlugName | null;
  theme: string | null;
  themeVariant: string[];
  activityGroup: string[];
  // child + adult/parent + dog + general/functional facilities + parking, flattened to slugs.
  essentials: string[];
  // route only.
  routeSuitability: string[];
  // route only.
  routeDifficulty: string[];
  distance?: number;
  durationMin?: number;
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
    case "venue":
    case "event":
    case "club": {
      // Adult + Fixed/Young/Older Child (whichever this record uses) combine
      // into one total on the card, instead of only ever showing Adult.
      const pricing = resolveTicketPricing(rec as unknown as OpportunityVenueV2 | OpportunityEventV2 | OpportunityClubV2);
      if (pricing.isFree) return { price: "Free", priceValue: 0 };
      return resolveCardTotalPrice(pricing);
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

function resolveGeneralFacilities(rec: EnrichedScoredRecommendationV2): SlugName[] | null {
  let raw: string | null = null;
  switch (rec.opportunityType) {
    case "venue": raw = (rec as unknown as OpportunityVenueV2).venueGeneralFacilities; break;
    case "event": raw = (rec as unknown as OpportunityEventV2).eventGeneralFacilities; break;
    case "club":  raw = (rec as unknown as OpportunityClubV2).clubGeneralFacilities; break;
    case "route": raw = (rec as unknown as OpportunityRouteV2).routeGeneralFacilities; break;
  }
  return toSlugNameList(raw);
}

function resolveDogFacilities(rec: EnrichedScoredRecommendationV2): SlugName[] | null {
  let raw: string | null = null;
  switch (rec.opportunityType) {
    case "venue": raw = (rec as unknown as OpportunityVenueV2).venueDogFacilities; break;
    case "event": raw = (rec as unknown as OpportunityEventV2).eventVenueDogFacilities; break;
    case "route": raw = (rec as unknown as OpportunityRouteV2).routeDogFacilities; break;
    // club has no dog-facilities field.
  }
  return toSlugNameList(raw);
}

function resolveParkingProvision(rec: EnrichedScoredRecommendationV2): SlugName[] | null {
  let raw: string | null = null;
  switch (rec.opportunityType) {
    case "venue": raw = (rec as unknown as OpportunityVenueV2).venueParkingProvision; break;
    case "event": raw = (rec as unknown as OpportunityEventV2).eventParkingProvision; break;
    case "club":  raw = (rec as unknown as OpportunityClubV2).clubParkingProvision; break;
    case "route": raw = (rec as unknown as OpportunityRouteV2).routeParkingProvision; break;
  }
  return toSlugNameList(raw);
}

// A theme belongs to one or more interest categories (opportunityTheme enum's
// interestCategorySlugs) — resolve the recommendation row's theme to its
// first/primary interest category, same convention AssetsService.getThemes()
// uses for ThemeRecord.interestId.
function resolveInterestCategory(themeSlug: string | undefined): SlugName | null {
  const firstThemeSlug = themeSlug?.split(",")[0]?.trim();
  if (!firstThemeSlug) return null;
  const theme = assets.getThemes().find((t) => t.slug === firstThemeSlug);
  return theme?.interestId ? toSlugName(theme.interestId[0]) : null;
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

export function resolveRouteSuitability(rec: EnrichedScoredRecommendationV2): SlugName[] {
  if (rec.opportunityType !== "route") return [];
  const route = rec as unknown as OpportunityRouteV2;
  return toSlugNameList(route.routeSuitability) ?? [];
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

const DURATION_UNIT_RE = /(min(?:ute)?s?|hours?|hrs?)/i;
const durationToMins = (val: number, unit: string) => (/hour|hr/i.test(unit) ? val * 60 : val);

/** Parses one duration segment ("30-60 mins", "30-60min", "1-2 hours", "45 mins") into its low/high bounds, in minutes. Null if unparseable. */
function parseDurationSegment(segment: string): { low: number; high: number } | null {
  // Each number carries its own unit: "30 min - 1 hour".
  const dualUnitMatch = segment.match(
    /(\d+(?:\.\d+)?)\s*(min(?:ute)?s?|hours?|hrs?)\s*[-–]\s*(\d+(?:\.\d+)?)\s*(min(?:ute)?s?|hours?|hrs?)/i,
  );
  if (dualUnitMatch) {
    return {
      low: durationToMins(parseFloat(dualUnitMatch[1]!), dualUnitMatch[2]!),
      high: durationToMins(parseFloat(dualUnitMatch[3]!), dualUnitMatch[4]!),
    };
  }
  // One trailing unit shared by both numbers: "30-60min", "1-2 hours" — the
  // far more common notation, so this must be tried before the single-value
  // fallback below (otherwise that would wrongly grab just the second number).
  const sharedUnitMatch = segment.match(
    /(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)\s*(min(?:ute)?s?|hours?|hrs?)/i,
  );
  if (sharedUnitMatch) {
    return {
      low: durationToMins(parseFloat(sharedUnitMatch[1]!), sharedUnitMatch[3]!),
      high: durationToMins(parseFloat(sharedUnitMatch[2]!), sharedUnitMatch[3]!),
    };
  }
  const singleMatch = segment.match(new RegExp(`(\\d+(?:\\.\\d+)?)\\s*${DURATION_UNIT_RE.source}`, "i"));
  if (singleMatch) {
    const mins = durationToMins(parseFloat(singleMatch[1]!), singleMatch[2]!);
    return { low: mins, high: mins };
  }
  return null;
}

/** Formats a single minutes value in whichever unit reads naturally: "45min" under an hour, "5hrs" (or "1.5hrs") at/above it. */
function formatDurationBound(mins: number): string {
  if (mins < 60) return `${Math.round(mins)}min`;
  return `${mins % 60 === 0 ? mins / 60 : (mins / 60).toFixed(1)}hrs`;
}

/**
 * Compact duration strings like "30 min - 1 hour" → "30-60 mins",
 * "1-2 hours" → "1-2 hrs". A theme/venue can also carry several ranges at
 * once (e.g. "30-60 mins, 1-2 hours, 4-5 hours" from multiple selected
 * estimated-duration enum values) — those combine into one overall span
 * using the lowest low and the highest high, each shown in its own natural
 * unit: "30min-5hrs".
 */
export function compactDuration(duration?: string | null): string | undefined {
  if (!duration) return undefined;

  const fallback = () => duration.replace(/\bhours?\b/gi, "hrs").replace(/\bminutes?\b/gi, "mins");

  const segments = duration.split(",").map((s) => s.trim()).filter(Boolean);
  const parsed = segments
    .map(parseDurationSegment)
    .filter((p): p is { low: number; high: number } => p !== null);

  // Nothing numeric to work with, or a single flat (non-range) value — leave as-is.
  if (parsed.length === 0) return fallback();
  if (parsed.length === 1 && parsed[0]!.low === parsed[0]!.high) return fallback();

  const overallLow = Math.min(...parsed.map((p) => p.low));
  const overallHigh = Math.max(...parsed.map((p) => p.high));

  if (overallHigh <= 90) return `${Math.round(overallLow)}-${Math.round(overallHigh)} mins`;
  if (overallLow >= 60) {
    const toHrs = (m: number) => (m % 60 === 0 ? `${m / 60}` : `${(m / 60).toFixed(1)}`);
    return `${toHrs(overallLow)}-${toHrs(overallHigh)} hrs`;
  }
  return `${formatDurationBound(overallLow)}-${formatDurationBound(overallHigh)}`;
}

/**
 * Resolves an estimated-duration enum-slug string (e.g. "thirty_sixty_mins, one_two_hours") into the
 * single compacted range `compactDuration` reports for it (e.g. "30min-2hrs"), wrapped as the one-element
 * `SlugName[]` the `estimated_visit_duration` field expects. Slugs must resolve to their human-readable
 * names *before* `compactDuration` runs — it parses digits/units out of text like "30-60mins", not slugs.
 */
export function resolveCompactDuration(raw: string | null): SlugName[] | null {
  const names = toSlugNameList(raw)?.map((e) => e.name).join(", ");
  if (!names) return null;
  const compacted = compactDuration(names) ?? names;
  return [{ name: compacted, slug: compacted }];
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
      const bookingLable = fields.bookingType?.split(",")?.[0]?.trim() ?? undefined;
     const costBooking = bookingLable
        ? cost.toLowerCase() === "free"
          ? bookingLable === "Open (Free) Access"
            ? bookingLable
            : `Free (${bookingLable})`
          : `${cost} (${bookingLable})`
        : cost;
      const timeLine = duration ? `Allow ${compactDuration(duration)}` : undefined;
      return {
        compact: { line1: costBooking, line2: journey, line2IsJourney: true },
        full: { line1: timeLine, line2: costBooking, line3: journey, line3IsJourney: true },
      };
    }

    case "route": {
      let routeTypeLabel = formatCardLabel(fields.routeType)?.split(",")[0].trim() ?? undefined;
      if (routeTypeLabel === "Out And Back") routeTypeLabel = "Out-Back";
      const durationPart = compactDuration(duration) || undefined;
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

// Flat slug bag used for client-side search/filter matching — every facility
// category that counts as "essential" (child, adult/parent, dog, general/
// functional, parking) flattened into one array of slugs, alongside theme/
// interest-category/activity-group identifiers and the resolved distance/duration.
function resolveSearchTags(
  rec: EnrichedScoredRecommendationV2,
  distanceKm: number | undefined,
  durationMin: number | undefined,
): SearchTags {
  const essentials = [
    ...(resolveChildFacilities(rec) ?? []),
    ...(resolveAdultFacilities(rec) ?? []),
    ...(resolveDogFacilities(rec) ?? []),
    ...(resolveGeneralFacilities(rec) ?? []),
    ...(resolveParkingProvision(rec) ?? []),
  ].map((facility) => facility.slug);

  const routeDifficulty = rec.opportunityType === "route"
    ? toSlugNameList((rec as unknown as OpportunityRouteV2).routeDifficulty)?.map((d) => d.slug) ?? []
    : [];

  return {
    interestCategory: resolveInterestCategory(rec.themeSlug),
    theme: rec.themeSlug ?? null,
    themeVariant: toSlugNameList(rec.themeVariantSlug)?.map((t) => t.slug) ?? [],
    activityGroup: (resolveActivityGroup(rec) ?? []).map((a) => a.slug),
    essentials,
    routeSuitability: resolveRouteSuitability(rec).map((s) => s.slug),
    routeDifficulty,
    ...(distanceKm !== undefined && { distance: distanceKm }),
    ...(durationMin !== undefined && { durationMin: durationMin*2 }),
  };
}

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
    searchTags: resolveSearchTags(rec, distanceKm, durationMin),
  };
}

export function toOpportunityList(data: EnrichedScoredRecommendationV2[]): Opportunity[] {
  return data.map(toOpportunity);
}
