import type { OpportunityClubV2 } from "../../types/opportunity-v2.types";
import type { OpportunityDetail } from "../../types/opportunity-detail.types";
import { buildImageUrls } from "./image-url";
import { resolveTicketPricing } from "./pricing";
import { resolveLiveStatus, resolveSeasonalHighlight } from "./opportunity-status";
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

function buildAddress(line1: string | null, line2: string | null): string | null {
  const parts = [line1, line2].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : null;
}

function parseCoord(val: string | null): number | null {
  if (!val) return null;
  const num = parseFloat(val);
  return isNaN(num) ? null : num;
}

/** Derive min_age from age-band booleans (lowest true band). */
function resolveMinAge(data: OpportunityClubV2): number | null {
  if (data.clubAgeSuitabilityUnder1S) return 0;
  if (data.clubAgeSuitability1To2Years) return 1;
  if (data.clubAgeSuitability3To4Years) return 3;
  if (data.clubAgeSuitability5To7Years) return 5;
  if (data.clubAgeSuitability8To12Years) return 8;
  if (data.clubAgeSuitabilityOver13Years) return 13;
  if (data.clubAgeSuitabilityAdults) return 18;
  return null;
}

/** Derive max_age from age-band booleans (highest true band). */
function resolveMaxAge(data: OpportunityClubV2): number | null {
  if (data.clubAgeSuitabilityAdults) return null; // no upper cap
  if (data.clubAgeSuitabilityOver13Years) return 17;
  if (data.clubAgeSuitability8To12Years) return 12;
  if (data.clubAgeSuitability5To7Years) return 7;
  if (data.clubAgeSuitability3To4Years) return 4;
  if (data.clubAgeSuitability1To2Years) return 2;
  if (data.clubAgeSuitabilityUnder1S) return 1;
  return null;
}

function resolveSuitableFor(data: OpportunityClubV2): string[] | null {
  const bands: string[] = [];
  if (data.clubAgeSuitabilityUnder1S) bands.push("Under 1");
  if (data.clubAgeSuitability1To2Years) bands.push("1–2 years");
  if (data.clubAgeSuitability3To4Years) bands.push("3–4 years");
  if (data.clubAgeSuitability5To7Years) bands.push("5–7 years");
  if (data.clubAgeSuitability8To12Years) bands.push("8–12 years");
  if (data.clubAgeSuitabilityOver13Years) bands.push("13+ years");
  if (data.clubAgeSuitabilityAdults) bands.push("Adults");
  return bands.length > 0 ? bands : null;
}

function buildFacilities(data: OpportunityClubV2): SlugName[] | null {
  const all = [data.clubGeneralFacilities, data.clubChildFacilities, data.clubAdultFacilities]
    .flatMap((raw) => toSlugNameList(raw) ?? []);
  return all.length > 0 ? all : null;
}

function buildForThem(data: OpportunityClubV2): SlugName[] | null {
  const childFacilities = toSlugNameList(data.clubChildFacilities) ?? [];

  // if (childFacilities.length === 0) {
  //   const seasonalTag = data.clubSeasonalTag ? toSlugNameList(data.clubSeasonalTag) ?? [] : [];
  //   const seasonalHighlights = data.clubSeasonalHighlights ? toSlugNameList(data.clubSeasonalHighlights) ?? [] : [];

  //   const combined = [...seasonalTag, ...seasonalHighlights];
  //   return combined.length > 0 ? combined : null;
  // }

  if (childFacilities.length === 0) {
    const attractions = data.clubAttractions ? toSlugNameList(data.clubAttractions) ?? [] : [];

    return attractions.length > 0 ? attractions : null;
  }

  return childFacilities
}

/**
 * Build club_availability from the mixed-timing columns.
 * Returns e.g. { monday: ["09:00–10:30"], wednesday: ["14:00–15:00"] }
 */
function buildAvailability(data: OpportunityClubV2): Record<string, string[]> | null {
  const days: [string, string | null, string | null][] = [
    ["monday", data.clubMixedTimingsMondayStartTime, data.clubMixedTimingsMondayEndTime],
    ["tuesday", data.clubMixedTimingsTuesdayStartTime, data.clubMixedTimingsTuesdayEndTime],
    ["wednesday", data.clubMixedTimingsWednesdayStartTime, data.clubMixedTimingsWednesdayEndTime],
    ["thursday", data.clubMixedTimingsThursdayStartTime, data.clubMixedTimingsThursdayEndTime],
    ["friday", data.clubMixedTimingsFridayStartTime, data.clubMixedTimingsFridayEndTime],
    ["saturday", data.clubMixedTimingsSaturdayStartTime, data.clubMixedTimingsSaturdayEndTime],
    ["sunday", data.clubMixedTimingsSundayStartTime, data.clubMixedTimingsSundayEndTime],
  ];

  // Fall back to fixed daily timings if no mixed timings are set
  if (data.clubFixedDailyTimings && data.clubDailyStartTime) {
    const slot = data.clubDailyEndTime
      ? `${data.clubDailyStartTime}–${data.clubDailyEndTime}`
      : data.clubDailyStartTime;
    const schedule = data.clubDailySchedule
      ? splitList(data.clubDailySchedule) ?? days.map(([d]) => d)
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

export function buildScheduleInfo(data: OpportunityClubV2): { title: string; subtitle: string } | null {
  const weekDays: Record<string, string> = {
    monday: "Mon",
    tuesday: "Tue",
    wednesday: "Wed",
    thursday: "Thu",
    friday: "Fri",
    saturday: "Sat",
    sunday: "Sun",
  };

  if (data.clubFixedDailyTimings && data.clubFixedDailyTimings && data.clubDailyStartTime) {
    const days = splitList(data.clubDailySchedule)?.map(day => weekDays[day.trim().toLowerCase()] || day)
      .join(", ") ?? null;

    const time = data.clubDailyEndTime
      ? `${data.clubDailyStartTime}–${data.clubDailyEndTime}`
      : data.clubDailyStartTime;
    return { title: days ?? "Daily", subtitle: time };
  }

  const weekDaysShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

  const todayIndex = new Date().getDay();
  const todayShort = weekDaysShort[todayIndex];

  // map day index to your mixedDays structure
  const mixedDays: [string, string | null, string | null][] = [
    ["Mon", data.clubMixedTimingsMondayStartTime, data.clubMixedTimingsMondayEndTime],
    ["Tue", data.clubMixedTimingsTuesdayStartTime, data.clubMixedTimingsTuesdayEndTime],
    ["Wed", data.clubMixedTimingsWednesdayStartTime, data.clubMixedTimingsWednesdayEndTime],
    ["Thu", data.clubMixedTimingsThursdayStartTime, data.clubMixedTimingsThursdayEndTime],
    ["Fri", data.clubMixedTimingsFridayStartTime, data.clubMixedTimingsFridayEndTime],
    ["Sat", data.clubMixedTimingsSaturdayStartTime, data.clubMixedTimingsSaturdayEndTime],
    ["Sun", data.clubMixedTimingsSundayStartTime, data.clubMixedTimingsSundayEndTime],
  ];

  // find today entry
  const today = mixedDays.find(([d]) => d === todayShort);

  if (today) {
    const [, start, end] = today;

    if (start) {
      return {
        title: todayShort,
        subtitle: end ? `${start}–${end}` : start,
      };
    }

    return {
      title: todayShort,
      subtitle: "Closed",
    };
  }

  // fallback (if no match for some reason)
  const active = mixedDays.filter(([, start]) => !!start);

  if (active.length === 0) return null;

  const title = active.map(([d]) => d).join(", ");
  const [, start, end] = active[0]!;
  const subtitle = end ? `${start}–${end}` : "-";

  return { title, subtitle };
}

const CLUB_COMMITMENT_LABELS: Record<string, string> = {
  pay_and_go: "Pay & Go",
  monthly: "Monthly Commitment",
  termly: "Termly Commitment",
  annually: "Annual Commitment",
};

function resolveClubCommitmentLabel(commitment: string | null): string {
  if (!commitment) return "—";
  return CLUB_COMMITMENT_LABELS[commitment] ?? toSlugName(commitment).name;
}

function buildInfoData(data: OpportunityClubV2): any[] | null {
  const infoList: { icon: string; title: string; subtitle: string; label: string }[] = [];

  const schedule = buildScheduleInfo(data);
  if (schedule) {
    infoList.push({ icon: "schedule", title: schedule.title, subtitle: schedule.subtitle, label: "Schedule" });
  }

  if (data.clubFormat || data.clubFrequency) {
    infoList.push({
      icon: "format",
      title: data.clubFormat ? toSlugName(data.clubFormat).name : "—",
      subtitle: data.clubFrequency ? toSlugName(data.clubFrequency).name : "—",
      label: "Format",
    });
  }

  const bookingTitle = data.ticketingRequirement ? "Book Ahead" : "Drop In";
  if (data.ticketingRequirement !== null || data.clubCommittment) {
    infoList.push({ icon: "booking", title: bookingTitle, subtitle: resolveClubCommitmentLabel(data.clubCommittment), label: "Booking" });
  }

  return infoList.length > 0 ? infoList : null;
}

function resolvePriceInfo(data: OpportunityClubV2): string | null {
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

function buildPerfectFor(data: OpportunityClubV2) : any[] | null {

  let perfectFor = [];

  const abilityLevel = toSlugNameList(data.clubAbilityLevel)?.map((e) => e.name).join(", ");
  const suitableAges = resolveSuitableFor(data)?.join(", ");
  const skillArea = toSlugNameList(data.clubSkillArea)?.map((e) => e.name).join(", ");

 if(abilityLevel) perfectFor.push({title: abilityLevel, label: 'ability'});
  if(suitableAges) perfectFor.push({title: suitableAges, label:  'ages'})
  if(skillArea) perfectFor.push({title: skillArea, label: 'skill'});

  return perfectFor.length > 0 ? perfectFor :  null;
}

// ── Formatter ─────────────────────────────────────────────────────────────────

export const clubToOpportunity = (data: OpportunityClubV2): OpportunityDetail => {
  const hasTicketing = data.ticketingRequirement === true;
  const anyPrice = data.ticketVariantAdultPrice ?? data.ticketVariantFixedChildPrice ?? data.ticketVariantYoungChildPrice ?? data.ticketVariantOlderChildPrice ?? data.ticketVariantBabyPrice;
  const pricing = resolveTicketPricing(data);

  const opp: OpportunityDetail = {
    // ── Core ──────────────────────────────────────────────
    id: data.id,
    opp_type: "club",
    name: data.clubName,
    description: data.clubDescription,
    image_urls: buildImageUrls(data.image, "club"),

    // Location
    address: buildAddress(data.clubAddressLine1, data.clubAddressLine2),
    city: data.clubCityTown,
    postcode: data.clubPostcode,
    latitude: parseCoord(data.latitude),
    longitude: parseCoord(data.longitude),

    // Classification
    interest_category: data.theme.name,
    opp_category: data.theme.slug,
    subcategory: data.themeVariant.name,
    activity_effort_tag: toSlugNameList(data.clubActivityGroup),

    // Suitability
    min_age: resolveMinAge(data),
    max_age: resolveMaxAge(data),
    // suitable_for: resolveSuitableFor(data),
    suitable_for: toSlugNameList(data.clubChildFacilities),
    interest_tags: splitList(data.clubInterestTags),
    accessibility_features: null,

    // Facilities
    facilities: buildFacilities(data),
    parking_provision: toSlugNameList(data.clubParkingProvision),
    required_kit: toSlugNameList(data.clubExtraKit),
    weather_suitability: null,
    seasonal_tag: toSlugNameList(data.clubSeasonalTag),
    seasonal_highlights: toSlugNameList(data.clubSeasonalHighlights),
    terrain: null,
    forThem: buildForThem(data),
    forYou: toSlugNameList(data.clubAdultFacilities),
    highlights: toSlugNameList(data.clubSeasonalHighlights),
    perfectFor: buildPerfectFor(data),

    // Pricing
    is_free: (!hasTicketing && !anyPrice) || pricing.isFree,
    entry_cost: anyPrice ?? null,
    price_info: resolvePriceInfo(data),
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

    // ── Venue only (n/a for club) ──────────────────────────
    opening_hours: null,
    estimated_visit_duration: null,

    // ── Route only (n/a for club) ──────────────────────────
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
    opportunity_theme_variant: data.themeVariant.slug,

    // ── Club only ─────────────────────────────────────────
    club_type: data.clubFormat ? toSlugName(data.clubFormat) : null,
    club_commitment: data.clubCommittment ? toSlugName(data.clubCommittment) : null,
    club_session_cost: data.ticketVariantOlderChildPrice ?? data.ticketVariantAdultPrice,
    club_total_cost: null,
    club_session_total: data.clubDailyFixedSessionTotal,
    club_availability: buildAvailability(data),
    requires_booking: data.ticketingRequirement,

    // ── Event only (n/a for club) ──────────────────────────
    start_date: data.clubStartDate ? data.clubStartDate.toISOString() : null,
    end_date: data.clubEndDate ? data.clubEndDate.toISOString() : null,
    event_type: null,
    event_times: null,
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
  opp.liveStatus = resolveLiveStatus(opp);
  opp.seasonalHighlight = resolveSeasonalHighlight(opp.seasonal_highlights, opp.seasonal_tag, toSlugNameList(data.clubAttractions));
  
  return opp;
};
