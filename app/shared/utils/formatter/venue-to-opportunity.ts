import type { OpportunityVenueV2 } from "../../types/opportunity-v2.types";
import type { OpportunityDetail } from "../../types/opportunity-detail.types";
import { buildImageUrls } from "./image-url";
import { resolveTicketPricing } from "./pricing";
import { resolveLiveStatus, resolveSeasonalHighlight } from "./opportunity-status";
import { toSlugNameList, type SlugName } from "../slug-name";
import { resolveCompactDuration } from "./recommendation-formatter";

// ── Helpers ───────────────────────────────────────────────────────────────────

function splitList(raw: string | null): string[] | null {
  if (!raw) return null;
  const parts = raw
    .split(",")
    .map((s) => s.trim().replace(/^["']+|["']+$/g, "").trim())
    .filter(Boolean);
  return parts.length > 0 ? parts : null;
}

function buildAddress(line1: string | null, line2: string | null): string | null {
  const parts = [line1, line2].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : null;
}

function parseCoord(val: string | null): number | null {
  if (!val) return null;
  const num = parseFloat(val);
  return isNaN(num) ? null : num;
}

function resolveMinAge(data: OpportunityVenueV2): number | null {
  if (data.venueAgeSuitabilityUnder1Years) return 0;
  if (data.venueAgeSuitability1To2Years) return 1;
  if (data.venueAgeSuitability3To4Years) return 3;
  if (data.venueAgeSuitability5To7Years) return 5;
  if (data.venueAgeSuitability8To12Years) return 8;
  if (data.venueAgeSuitabilityOver13Years) return 13;
  if (data.venueAgeSuitabilityAdults) return 18;
  return null;
}

function resolveMaxAge(data: OpportunityVenueV2): number | null {
  if (data.venueAgeSuitabilityAdults) return null;
  if (data.venueAgeSuitabilityOver13Years) return 17;
  if (data.venueAgeSuitability8To12Years) return 12;
  if (data.venueAgeSuitability5To7Years) return 7;
  if (data.venueAgeSuitability3To4Years) return 4;
  if (data.venueAgeSuitability1To2Years) return 2;
  if (data.venueAgeSuitabilityUnder1Years) return 1;
  return null;
}

function resolveSuitableFor(data: OpportunityVenueV2): string[] | null {
  const bands: string[] = [];
  if (data.venueAgeSuitabilityUnder1Years) bands.push("Under 1");
  if (data.venueAgeSuitability1To2Years) bands.push("1–2 years");
  if (data.venueAgeSuitability3To4Years) bands.push("3–4 years");
  if (data.venueAgeSuitability5To7Years) bands.push("5–7 years");
  if (data.venueAgeSuitability8To12Years) bands.push("8–12 years");
  if (data.venueAgeSuitabilityOver13Years) bands.push("13+ years");
  if (data.venueAgeSuitabilityAdults) bands.push("Adults");
  return bands.length > 0 ? bands : null;
}

function buildFacilities(data: OpportunityVenueV2): SlugName[] | null {
  const all = [data.venueGeneralFacilities, data.venueChildFacilities, data.venueAdultFacilities]
    .flatMap((raw) => toSlugNameList(raw) ?? []);
  return all.length > 0 ? all : null;
}

/** "00:00"–"24:00" is how the source sheet marks a venue as open all day (see scripts/parse-venues-data.ts). */
function isAllDay(open: string | null | undefined, close: string | null | undefined): boolean {
  return open === "00:00" && close === "24:00";
}

function buildOpeningHours(data: OpportunityVenueV2): Record<string, { open?: string; close?: string; allDay?: boolean }> | null {
  const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
  type Day = typeof DAYS[number];

  const mixedStart: Record<Day, string | null> = {
    monday:    data.venueMixedTimingsMondayStart,
    tuesday:   data.venueMixedTimingsTuesdayStart,
    wednesday: data.venueMixedTimingsWednesdayStart,
    thursday:  data.venueMixedTimingsThursdayStart,
    friday:    data.venueMixedTimingsFridayStart,
    saturday:  data.venueMixedTimingsSaturdayStart,
    sunday:    data.venueMixedTimingsSundayStart,
  };
  const mixedEnd: Record<Day, string | null> = {
    monday:    data.venueMixedTimingsMondayEnd,
    tuesday:   data.venueMixedTimingsTuesdayEnd,
    wednesday: data.venueMixedTimingsWednesdayEnd,
    thursday:  data.venueMixedTimingsThursdayEnd,
    friday:    data.venueMixedTimingsFridayEnd,
    saturday:  data.venueMixedTimingsSaturdayEnd,
    sunday:    data.venueMixedTimingsSundayEnd,
  };

  if (data.venueFixedDailyTimings && data.venueFixedTimingsStartTime) {
    const days = data.venueSchedulePattern
      ? splitList(data.venueSchedulePattern) ?? [...DAYS]
      : [...DAYS];
    const entry: { open?: string; close?: string; allDay?: boolean } = { open: data.venueFixedTimingsStartTime };
    if (data.venueFixedTimingsEndTime) entry.close = data.venueFixedTimingsEndTime;
    if (isAllDay(data.venueFixedTimingsStartTime, data.venueFixedTimingsEndTime)) entry.allDay = true;
    const out: Record<string, { open?: string; close?: string; allDay?: boolean }> = {};
    for (const day of days) out[day.toLowerCase()] = entry;
    return out;
  }

  const result: Record<string, { open?: string; close?: string; allDay?: boolean }> = {};
  for (const day of DAYS) {
    const start = mixedStart[day];
    if (!start) continue;
    const end = mixedEnd[day];
    result[day] = { open: start, ...(end ? { close: end } : {}), ...(isAllDay(start, end) ? { allDay: true } : {}) };
  }
  return Object.keys(result).length > 0 ? result : null;
}

function resolvePriceInfo(data: OpportunityVenueV2): string | null {
  const parts: string[] = [];
  if (data.ticketVariantDefinitionAdult && data.ticketVariantAdultPrice)
    parts.push(`${data.ticketVariantDefinitionAdult}: ${data.ticketVariantAdultPrice}`);
  if (data.ticketVariantDefinitionOlderChild && data.ticketVariantOlderChildPrice)
    parts.push(`${data.ticketVariantDefinitionOlderChild}: ${data.ticketVariantOlderChildPrice}`);
  if (data.ticketVariantDefinitionYoungChild && data.ticketVariantYoungChildPrice)
    parts.push(`${data.ticketVariantDefinitionYoungChild}: ${data.ticketVariantYoungChildPrice}`);
  if (data.ticketVariantDefinitionBaby && data.ticketVariantBabyPrice)
    parts.push(`${data.ticketVariantDefinitionBaby}: ${data.ticketVariantBabyPrice}`);
  return parts.length > 0 ? parts.join(" · ") : null;
}

function buildForThem(data: OpportunityVenueV2): SlugName[] | null {
  const childFacilities = toSlugNameList(data.venueChildFacilities) ?? [];

  // if (childFacilities.length === 0) {
  //   const seasonalHighlights = data.venueSeasonalHighlights ? toSlugNameList(data.venueSeasonalHighlights) ?? [] : [];
  //   const seasonalTag = data.venueSeasonalTag ? toSlugNameList(data.venueSeasonalTag) ?? [] : [];

  //   const combined = [...seasonalHighlights, ...seasonalTag];
  //   return combined.length > 0 ? combined : null;
  // }
  if (childFacilities.length === 0) {
    const attractions = data.venueAttractions ? toSlugNameList(data.venueAttractions) ?? [] : [];

    return attractions.length > 0 ? attractions : null;
  }

  return childFacilities
}

// ── Formatter ─────────────────────────────────────────────────────────────────

export const venueToOpportunity = (data: OpportunityVenueV2): OpportunityDetail => {
  const hasEntryCost = data.venueEntryCost === true;
  const anyPrice = data.ticketVariantAdultPrice ?? data.ticketVariantFixedChildPrice ?? data.ticketVariantYoungChildPrice ?? data.ticketVariantOlderChildPrice ?? data.ticketVariantBabyPrice;
  const pricing = resolveTicketPricing(data);

  const opp: OpportunityDetail = {
    // ── Core ──────────────────────────────────────────────
    id: data.id,
    opp_type: "venue",
    name: data.venueName,
    description: data.venueDescription,
    image_urls: buildImageUrls(data.image, "venue"),

    // Location
    address: buildAddress(data.venueAddressLine1, data.venueAddressLine2),
    city: data.venueCity,
    postcode: data.venuePostcode,
    latitude: parseCoord(data.latitude),
    longitude: parseCoord(data.longitude),

    // Classification
    interest_category: data.theme.name,
    opp_category: data.theme.slug,
    subcategory: data.themeVariant.name,
    activity_effort_tag: toSlugNameList(data.venueActivityGroup),
    opportunity_theme_variant: data.themeVariant.slug,

    // Suitability
    min_age: resolveMinAge(data),
    max_age: resolveMaxAge(data),
    // suitable_for: toSlugNameList(data.venueChildFacilities),
    suitable_for: null,
    interest_tags: splitList(data.venueInterestTags),
    accessibility_features: null,

    // Facilities
    facilities: buildFacilities(data),
    parking_provision: toSlugNameList(data.venueParkingProvision),
    required_kit: toSlugNameList(data.venueExtraKit),
    weather_suitability: toSlugNameList(data.venueDetailedWeatherSuitability),
    seasonal_tag: toSlugNameList(data.venueSeasonalTag),
    seasonal_highlights: toSlugNameList(data.venueSeasonalHighlights),
    terrain: null,
    forThem:buildForThem(data),
    forYou: toSlugNameList(data.venueAdultFacilities),
    highlights: toSlugNameList(data.venueSeasonalHighlights),
    perfectFor: null,

    // Pricing
    is_free: (!hasEntryCost && !anyPrice) || pricing.isFree,
    entry_cost: anyPrice ?? null,
    price_info: resolvePriceInfo(data),
    booking_type: toSlugNameList(data.venueBookingType),
    adult_price: pricing.adultPrice,
    child_price: pricing.childPrice,
    infant_price: pricing.babyPrice,
    family_price: null,
    concession_price: pricing.concessionPrice,
    pricingTiers: pricing.tiers,

    // Contact / links
    website_url: null,
    booking_url: null,
    contact_email: null,
    contact_phone: null,

    // Provider
    provider_id: data.id,

    // ── Venue only ────────────────────────────────────────
    opening_hours: buildOpeningHours(data),
    estimated_visit_duration: resolveCompactDuration(data.venueEstimatedDuration),
    // ── Route only (n/a for venue) ────────────────────────
    route_type: null,
    route_distance: null,
    route_start_point: null,
    route_estimate_u5: null,
    route_estimate_510: null,
    route_estimate_10: null,
    difficulty_rating: null,
    dog_facilities: toSlugNameList(data.venueDogFacilities),
    bike_route: null,
    scooter_route: null,

    // ── Club only (n/a for venue) ─────────────────────────
    club_type: null,
    club_commitment: null,
    club_session_cost: null,
    club_total_cost: null,
    club_session_total: null,
    club_availability: null,
    requires_booking: data.ticketingRequirement,

    // ── Event only (n/a for venue) ────────────────────────
    start_date: null,
    end_date: null,
    event_type: null,
    event_times: null,
    venue_name: null,
    max_capacity: null,
    spots_remaining: null,
    is_online: null,
    special_interest_tags: null,
    info_list: null,

    // ── Computed ──────────────────────────────────────────
    liveStatus: { variant: "closed", message: "" },
    seasonalHighlight: null,
  };
  opp.liveStatus = resolveLiveStatus(opp);
  opp.seasonalHighlight = resolveSeasonalHighlight(opp.seasonal_highlights, opp.seasonal_tag, toSlugNameList(data.venueAttractions));

  return opp;
};
