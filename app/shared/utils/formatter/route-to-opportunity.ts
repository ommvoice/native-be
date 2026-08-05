import type { OpportunityRouteV2 } from "../../types/opportunity-v2.types";
import type { OpportunityDetail } from "../../types/opportunity-detail.types";
import { buildImageUrls } from "./image-url";
import { buildPricingTiers } from "./pricing";
import { resolveLiveStatus, resolveSeasonalHighlight } from "./opportunity-status";
import { toSlugName, toSlugNameList, type SlugName } from "../slug-name";
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

function resolveMinAge(data: OpportunityRouteV2): number | null {
  if (data.routeAgeSuitabilityUnder1S) return 0;
  if (data.routeAgeSuitability1To2Years) return 1;
  if (data.routeAgeSuitability3To4Years) return 3;
  if (data.routeAgeSuitability5To7Years) return 5;
  if (data.routeAgeSuitability8To12Years) return 8;
  if (data.routeAgeSuitabilityOver13Years) return 13;
  if (data.routeAgeSuitabilityAdults) return 18;
  return null;
}

function resolveMaxAge(data: OpportunityRouteV2): number | null {
  if (data.routeAgeSuitabilityAdults) return null;
  if (data.routeAgeSuitabilityOver13Years) return 17;
  if (data.routeAgeSuitability8To12Years) return 12;
  if (data.routeAgeSuitability5To7Years) return 7;
  if (data.routeAgeSuitability3To4Years) return 4;
  if (data.routeAgeSuitability1To2Years) return 2;
  if (data.routeAgeSuitabilityUnder1S) return 1;
  return null;
}

function resolveSuitableFor(data: OpportunityRouteV2): string[] | null {
  const bands: string[] = [];
  if (data.routeAgeSuitabilityUnder1S) bands.push("Under 1");
  if (data.routeAgeSuitability1To2Years) bands.push("1–2 years");
  if (data.routeAgeSuitability3To4Years) bands.push("3–4 years");
  if (data.routeAgeSuitability5To7Years) bands.push("5–7 years");
  if (data.routeAgeSuitability8To12Years) bands.push("8–12 years");
  if (data.routeAgeSuitabilityOver13Years) bands.push("13+ years");
  if (data.routeAgeSuitabilityAdults) bands.push("Adults");
  return bands.length > 0 ? bands : null;
}

function buildFacilities(data: OpportunityRouteV2): SlugName[] | null {
  const all = [data.routeGeneralFacilities, data.routeChildFacilities, data.routeAdultFacilities]
    .flatMap((raw) => toSlugNameList(raw) ?? []);
  return all.length > 0 ? all : null;
}

function buildForThem(data: OpportunityRouteV2): SlugName[] | null {
  const childFacilities = toSlugNameList(data.routeChildFacilities) ?? [];

  // if (childFacilities.length === 0) {
  //   const seasonalHighlights = data.routeSeasonalHighlights ? toSlugNameList(data.routeSeasonalHighlights) ?? [] : [];
  //   const seasonalTag = data.routeSeasonalTag ? toSlugNameList(data.routeSeasonalTag) ?? [] : [];

  //   const combined = [...seasonalHighlights, ...seasonalTag];
  //   return combined.length > 0 ? combined : null;
  // }

  if (childFacilities.length === 0) {
    const attractions = data.routeAttractions ? toSlugNameList(data.routeAttractions) ?? [] : [];

    return attractions.length > 0 ? attractions : null;
  }

  return childFacilities
}

// ── Formatter ─────────────────────────────────────────────────────────────────

export const routeToOpportunity = (data: OpportunityRouteV2): OpportunityDetail => {
  const opp: OpportunityDetail = {
    // ── Core ──────────────────────────────────────────────
    id: data.id,
    opp_type: "route",
    name: data.routeName,
    description: data.routeDescription,
    image_urls: buildImageUrls(data.image, "route"),

    // Location
    address: buildAddress(data.routeAddressLine1, data.routeAddressLine2),
    city: null,
    postcode: data.routePostcode,
    latitude: parseCoord(data.latitude),
    longitude: parseCoord(data.longitude),

    // Classification
    interest_category: data.theme.name,
    opp_category: data.theme.slug,
    subcategory: data.themeVariant.name,
    activity_effort_tag: toSlugNameList(data.routeActivityGrouping),
    opportunity_theme_variant: data.themeVariant.slug,

    // Suitability
    min_age: resolveMinAge(data),
    max_age: resolveMaxAge(data),
    // suitable_for: resolveSuitableFor(data),
    suitable_for: toSlugNameList(data.routeSuitability),
    interest_tags: splitList(data.routeInterestTags),
    accessibility_features: null,

    // Facilities
    facilities: buildFacilities(data),
    parking_provision: toSlugNameList(data.routeParkingProvision),
    required_kit: toSlugNameList(data.routeExtraKit),
    weather_suitability: toSlugNameList(data.routeDetailedWeatherSuitability),
    seasonal_tag: toSlugNameList(data.routeSeasonalTag),
    seasonal_highlights: toSlugNameList(data.routeSeasonalHighlights),
    terrain: toSlugNameList(data.routeTerrainType),
    forThem:buildForThem(data),
    forYou: toSlugNameList(data.routeAdultFacilities),
    highlights: toSlugNameList(data.routeSeasonalHighlights),
    perfectFor: null,

    // Pricing (routes are typically free)
    is_free: true,
    entry_cost: null,
    price_info: null,
    booking_type: null,
    adult_price: null,
    child_price: null,
    infant_price: null,
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

    // ── Venue only (n/a for route) ────────────────────────
    opening_hours: null,
    estimated_visit_duration: resolveCompactDuration(data.routeEstimatedDuration),

    // ── Route only ────────────────────────────────────────
    route_type: toSlugNameList(data.routeType),
    route_distance: data.routeDistance,
    route_start_point: data.routeAddressLine1,
    route_estimate_u5: null,
    route_estimate_510: null,
    route_estimate_10: null,
    difficulty_rating: data.routeDifficulty ? toSlugName(data.routeDifficulty) : null,
    dog_facilities: toSlugNameList(data.routeDogFacilities),
    bike_route: null,
    scooter_route: null,

    // ── Club only (n/a for route) ─────────────────────────
    club_type: null,
    club_commitment: null,
    club_session_cost: null,
    club_total_cost: null,
    club_session_total: null,
    club_availability: null,
    requires_booking: null,

    // ── Event only (n/a for route) ────────────────────────
    start_date: null,
    end_date: null,
    event_type: null,
    event_times: null,
    venue_name: null,
    max_capacity: null,
    spots_remaining: null,
    is_online: null,
    special_interest_tags: null,
    info_list:  null,

    // ── Computed ──────────────────────────────────────────
    liveStatus: { variant: "closed", message: "" },
    seasonalHighlight: null,
  };
  opp.pricingTiers = buildPricingTiers(opp);
  opp.liveStatus = resolveLiveStatus(opp);
  opp.seasonalHighlight = resolveSeasonalHighlight(opp.seasonal_highlights, opp.seasonal_tag, toSlugNameList(data.routeAttractions));
  return opp;
};
