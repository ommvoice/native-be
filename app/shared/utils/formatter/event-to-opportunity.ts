import type { OpportunityEventV2 } from "../../types/opportunity-v2.types";
import type { OpportunityDetail } from "../../types/opportunity-detail.types";
import { buildImageUrls } from "./image-url";
import { buildPricingTiers } from "./pricing";
import { resolveLiveStatus } from "./opportunity-status";
import { toSlugName, toSlugNameList, type SlugName } from "../slug-name";

// ── Helpers ───────────────────────────────────────────────────────────────────

function splitList(raw: string | null): string[] | null {
  if (!raw) return null;
  const parts = raw
    .split(",")
    .map((s) => s.trim().replace(/^["']+|["']+$/g, "").trim())
    .filter(Boolean);
  return parts.length > 0 ? parts : null;
}

function parsePrice(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const num = parseFloat(raw.replace(/[^0-9.]/g, ""));
  return isNaN(num) ? null : num;
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

function resolveMinAge(data: OpportunityEventV2): number | null {
  if (data.eventAgeSuitabilityUnder1S) return 0;
  if (data.eventAgeSuitability1To2Years) return 1;
  if (data.eventAgeSuitability3To4Years) return 3;
  if (data.eventAgeSuitability5To7Years) return 5;
  if (data.eventAgeSuitability8To12Years) return 8;
  if (data.eventAgeSuitabilityOver13Years) return 13;
  if (data.eventAgeSuitabilityAdults) return 18;
  return null;
}

function resolveMaxAge(data: OpportunityEventV2): number | null {
  if (data.eventAgeSuitabilityAdults) return null;
  if (data.eventAgeSuitabilityOver13Years) return 17;
  if (data.eventAgeSuitability8To12Years) return 12;
  if (data.eventAgeSuitability5To7Years) return 7;
  if (data.eventAgeSuitability3To4Years) return 4;
  if (data.eventAgeSuitability1To2Years) return 2;
  if (data.eventAgeSuitabilityUnder1S) return 1;
  return null;
}

function resolveSuitableFor(data: OpportunityEventV2): string[] | null {
  const bands: string[] = [];
  if (data.eventAgeSuitabilityUnder1S) bands.push("Under 1");
  if (data.eventAgeSuitability1To2Years) bands.push("1–2 years");
  if (data.eventAgeSuitability3To4Years) bands.push("3–4 years");
  if (data.eventAgeSuitability5To7Years) bands.push("5–7 years");
  if (data.eventAgeSuitability8To12Years) bands.push("8–12 years");
  if (data.eventAgeSuitabilityOver13Years) bands.push("13+ years");
  if (data.eventAgeSuitabilityAdults) bands.push("Adults");
  return bands.length > 0 ? bands : null;
}

function buildFacilities(data: OpportunityEventV2): SlugName[] | null {
  const all = [data.eventGeneralFacilities, data.eventChildFacilities, data.eventAdultFacilities]
    .flatMap((raw) => toSlugNameList(raw) ?? []);
  return all.length > 0 ? all : null;
}

function buildEventTimes(data: OpportunityEventV2): Record<string, string[]> | null {
  const days: [string, string | null, string | null][] = [
    ["monday",    data.eventMixedTimingsMondayStart,    data.eventMixedTimingsMondayEnd],
    ["tuesday",   data.eventMixedTimingsTuesdayStart,   data.eventMixedTimingsTuesdayEnd],
    ["wednesday", data.eventMixedTimingsWednesdayStart, data.eventMixedTimingsWednesdayEnd],
    ["thursday",  data.eventMixedTimingsThursdayStart,  data.eventMixedTimingsThursdayEnd],
    ["friday",    data.eventMixedTimingsFridayStart,    data.eventMixedTimingsFridayEnd],
    ["saturday",  data.eventMixedTimingsSaturdayStart,  data.eventMixedTimingsSaturdayEnd],
    ["sunday",    data.eventMixedTimingsSundayStart,    data.eventMixedTimingsSundayEnd],
  ];

  if (data.eventDailyFixedTimings && data.eventDailyFixedStartTime) {
    const slot = data.eventDailyFixedEndTime
      ? `${data.eventDailyFixedStartTime}–${data.eventDailyFixedEndTime}`
      : data.eventDailyFixedStartTime;
    const schedule = data.eventTimetableWeekly
      ? splitList(data.eventTimetableWeekly) ?? days.map(([d]) => d)
      : days.map(([d]) => d);
    const out: Record<string, string[]> = {};
    for (const day of schedule) out[day] = [slot];
    return out;
  }

  const result: Record<string, string[]> = {};
  for (const [day, start, end] of days) {
    if (!start) continue;
    result[day] = [end ? `${start}–${end}` : start];
  }
  return Object.keys(result).length > 0 ? result : null;
}

export function buildScheduleInfo(data: OpportunityEventV2): { title: string; subtitle: string } | null {
  const eventStartDate = data.eventStartDate ? new Date(data.eventStartDate): null;
  const eventEndDate = data.eventEndDate ? new Date(data.eventEndDate): null;
  if (!eventStartDate && !eventEndDate) return null;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const start = eventStartDate ? new Date(eventStartDate.getFullYear(), eventStartDate.getMonth(), eventStartDate.getDate()) : null;
  const end = eventEndDate ? new Date(eventEndDate.getFullYear(), eventEndDate.getMonth(), eventEndDate.getDate()) : null;

  if (end && end < today) return { title: "Ended", subtitle: "Event has ended" };
  if (start && start.getTime() === today.getTime()) return { title: "Don't Miss It", subtitle: "Today" };
  if (end && end.getTime() === today.getTime()) return { title: "Don't Miss It", subtitle: "Last day" };

  if (end) {
    const daysLeft = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return { title: "Don't Miss It", subtitle: `${daysLeft} day${daysLeft === 1 ? "" : "s"} left` };
  }

  if (start && start > today) {
    const daysUntil = Math.ceil((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return { title: "Coming Soon", subtitle: `Starts in ${daysUntil} day${daysUntil === 1 ? "" : "s"}` };
  }

  return { title: "Don't Miss It", subtitle: "On now" };
}

function buildInfoData(data: OpportunityEventV2): any[] | null {
  const infoList: { icon: string; title: string; subtitle: string; label: string }[] = [];

  const schedule = buildScheduleInfo(data);
  if (schedule) {
    infoList.push({ icon: "schedule", title: schedule.title, subtitle: schedule.subtitle, label: "Schedule" });
  }

  if (data.eventType || data.eventSkillArea) {
    infoList.push({
      icon: "details",
      title: data.eventType ? toSlugName(data.eventType).name : "—",
      subtitle: toSlugNameList(data.eventSkillArea)?.map((e) => e.name).join(", ") ?? "—",
      label: "Event Details",
    });
  }

  if (data.eventBookingType || data.ticketingRequirement !== null) {
    const type = (data.eventBookingType ?? "").toLowerCase().trim();
    const title = type.includes("advance") ? "Book Ahead" : "Drop In";
    const subtitle = data.eventBookingType || "-";
    infoList.push({ icon: "booking", title, subtitle, label: "Booking" });
  }

  return infoList.length > 0 ? infoList : null;
}

function resolvePriceInfo(data: OpportunityEventV2): string | null {
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

function buildForThem(data: OpportunityEventV2): SlugName[] | null {
  const childFacilities = toSlugNameList(data.eventChildFacilities) ?? [];

  // if (childFacilities.length === 0) {
  //   const seasonalHighlights = data.eventSeasonalHighlights ? toSlugNameList(data.eventSeasonalHighlights) ?? [] : [];

  //   const combined = [...seasonalHighlights];
  //   return combined.length > 0 ? combined : null;
  // }

  return childFacilities
}

function buildPerfectFor(data: OpportunityEventV2) : any[] | null {

  let perfectFor = [];


  const abilityLevel = toSlugNameList(data.eventAbilityLevel)?.map((e) => e.name).join(", ");
  const suitableAges = resolveSuitableFor(data)?.join(", ");
  const skillArea = toSlugNameList(data.eventSkillArea)?.map((e) => e.name).join(", ");

  if(abilityLevel) perfectFor.push({title: abilityLevel, label: 'ability'});
  if(suitableAges) perfectFor.push({title: suitableAges, label:  'ages'})
  if(skillArea) perfectFor.push({title: skillArea, label: 'skill'});

  return perfectFor.length > 0 ? perfectFor :  null;
}


// ── Formatter ─────────────────────────────────────────────────────────────────

export const eventToOpportunity = (data: OpportunityEventV2): OpportunityDetail => {
  const hasEntryCost = data.eventEntryCost === true;
  const anyPrice = data.ticketVariantAdultPrice ?? data.ticketVariantOlderChildPrice ?? data.ticketVariantBabyPrice;

  const opp: OpportunityDetail = {
    // ── Core ──────────────────────────────────────────────
    id: data.id,
    opp_type: "event",
    name: data.eventName,
    description: data.eventDescription,
    image_urls: buildImageUrls(data.image, "event"),

    // Location
    address: buildAddress(data.eventAddressLine1, data.eventAddressLine2),
    city: data.eventCity,
    postcode: data.eventPostcode,
    latitude: parseCoord(data.latitude),
    longitude: parseCoord(data.longitude),

    // Classification
    interest_category: data.theme.name,
    opp_category: data.theme.slug,
    subcategory: data.themeVariant.name,
    activity_effort_tag: toSlugNameList(data.eventActivityGroup),
    opportunity_theme_variant: data.themeVariant.slug,

    // Suitability
    min_age: resolveMinAge(data),
    max_age: resolveMaxAge(data),
    // suitable_for: resolveSuitableFor(data),
    suitable_for: toSlugNameList(data.eventChildFacilities),
    interest_tags: splitList(data.eventInterestTags),
    accessibility_features: null,

    // Facilities
    facilities: buildFacilities(data),
    parking_provision: toSlugNameList(data.eventParkingProvision),
    required_kit: toSlugNameList(data.eventExtraKit),
    weather_suitability: toSlugNameList(data.eventDetailedWeatherSuitability),
    seasonal_tag: toSlugNameList(data.eventSeasonalTags),
    seasonal_highlights: toSlugNameList(data.eventSeasonalHighlights),
    terrain: null,
    forThem:buildForThem(data),
    forYou: toSlugNameList(data.eventAdultFacilities),
    highlights: toSlugNameList(data.eventHighlights),
    perfectFor:  buildPerfectFor(data),

    // Pricing
    is_free: !hasEntryCost && !anyPrice,
    entry_cost: anyPrice ?? null,
    price_info: resolvePriceInfo(data),
    adult_price: parsePrice(data.ticketVariantAdultPrice),
    child_price: parsePrice(data.ticketVariantOlderChildPrice ?? data.ticketVariantYoungChildPrice),
    infant_price: parsePrice(data.ticketVariantBabyPrice),
    family_price: null,
    concession_price: null,
    pricingTiers: [],

    // Contact / links
    website_url: null,
    booking_url: null,
    contact_email: null,
    contact_phone: null,

    // Provider
    provider_id: data.id,

    // ── Venue only (n/a for event) ────────────────────────
    opening_hours: null,
    estimated_visit_duration: null,

    // ── Route only (n/a for event) ────────────────────────
    route_type: null,
    route_distance: null,
    route_start_point: null,
    route_estimate_u5: null,
    route_estimate_510: null,
    route_estimate_10: null,
    difficulty_rating: null,
    dog_facilities: null,
    bike_route: null,
    scooter_route: null,

    // ── Club only (n/a for event) ─────────────────────────
    club_type: null,
    club_commitment: null,
    club_session_cost: null,
    club_total_cost: null,
    club_session_total: null,
    club_availability: null,
    requires_booking: data.ticketingRequirement,

    // ── Event only ────────────────────────────────────────
    start_date: data.eventStartDate ? data.eventStartDate.toISOString() : null,
    end_date: data.eventEndDate ? data.eventEndDate.toISOString() : null,
    event_type: data.eventType ? toSlugName(data.eventType) : null,
    event_times: buildEventTimes(data),
    venue_name: null,
    max_capacity: null,
    spots_remaining: null,
    is_online: null,
    special_interest_tags: null,
    info_list: buildInfoData(data),

    // ── Computed ──────────────────────────────────────────
    liveStatus: { variant: "closed", message: "" },
    seasonalHighlight: null,
  };
  opp.pricingTiers = buildPricingTiers(opp);
  opp.liveStatus = resolveLiveStatus(opp);
  return opp;
};
