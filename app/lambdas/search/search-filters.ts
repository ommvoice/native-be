import type {
  OpportunityVenueV2,
  OpportunityEventV2,
  OpportunityClubV2,
  OpportunityRouteV2,
} from '../../shared/types/opportunity-v2.types';
import type { OpportunityRecordType } from '../../repositories/driving-leg.repository';
import type { FacilityRecord } from '../../repositories/facility.repository';
import {
  resolveRouteSuitability,
  type EnrichedScoredRecommendationV2,
} from '../../shared/utils/formatter/recommendation-formatter';

export type RawSearchPayload =
  (OpportunityVenueV2 | OpportunityEventV2 | OpportunityClubV2 | OpportunityRouteV2) & {
    opportunityType: OpportunityRecordType;
  };

export interface SearchFilterParams {
  themeSlug?: string;
  themeVariantSlugs?: string[];
  facilitySlugs?: string[];
  routeDifficulty?: string[];
  routeType?: string[];
  routeMaxLengthMiles?: number;
  routeSuitability?: string[];
  attractions?: string[];
}

// Maps SearchFilterSheet's ROUTE_SUITABILITY_OPTIONS values to the keys
// resolveRouteSuitability() actually produces (recommendation-formatter.ts).
const SUITABILITY_FILTER_TO_KEY: Record<string, string> = {
  carrier_only: 'Carriers',
  bike_friendly: 'Bikes',
  buggy_friendly: 'Buggies',
  dog_friendly: 'Dogs',
  scooter_route: 'Scooters',
  wheelchair_friendly: 'Wheelchairs',
};

// Maps SearchFilterSheet's GENERIC_ATTRACTIONS values to a keyword to match
// against the free-text attractions/highlights fields — there's no dedicated
// attraction taxonomy on the backend, same class of gap as route suitability.
const ATTRACTION_LABELS: Record<string, string> = {
  scenic_views: 'scenic',
  wildlife_spotting: 'wildlife',
  play_areas_nearby: 'play area',
  picnic_spots: 'picnic',
  water_features: 'water',
  historic_features: 'historic',
  trails_to_explore: 'trail',
  photo_opportunities: 'photo',
  seasonal_highlights: 'seasonal',
  hands_on_activities: 'hands-on',
};

function getFacilityText(rec: RawSearchPayload): string {
  const parts: (string | null)[] = [];
  switch (rec.opportunityType) {
    case 'venue': {
      const v = rec as OpportunityVenueV2;
      parts.push(v.venueGeneralFacilities, v.venueChildFacilities, v.venueAdultFacilities);
      break;
    }
    case 'event': {
      const e = rec as OpportunityEventV2;
      parts.push(e.eventGeneralFacilities, e.eventChildFacilities, e.eventAdultFacilities);
      break;
    }
    case 'club': {
      const c = rec as OpportunityClubV2;
      parts.push(c.clubGeneralFacilities, c.clubChildFacilities, c.clubAdultFacilities);
      break;
    }
    case 'route': {
      const r = rec as OpportunityRouteV2;
      parts.push(r.routeGeneralFacilities, r.routeChildFacilities, r.routeAdultFacilities, r.routeDogFacilities);
      break;
    }
  }
  return parts.filter(Boolean).join(', ').toLowerCase();
}

function getAttractionsText(rec: RawSearchPayload): string {
  switch (rec.opportunityType) {
    case 'venue': return ((rec as OpportunityVenueV2).venueAttractions ?? '').toLowerCase();
    case 'event': return ((rec as OpportunityEventV2).eventHighlights ?? '').toLowerCase();
    case 'club':  return ((rec as OpportunityClubV2).clubAttractions ?? '').toLowerCase();
    case 'route': return ((rec as OpportunityRouteV2).routeAttractions ?? '').toLowerCase();
    default:      return '';
  }
}

/** Mirrors native-fe-v0's RoutePanel.tsx formatDistance(): assumes km when no unit is given. */
export function parseDistanceMiles(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const match = raw.match(/([\d.]+)\s*(km|mi|miles|m)?/i);
  if (!match) return null;
  const value = parseFloat(match[1]!);
  if (isNaN(value)) return null;
  const unit = (match[2] ?? '').toLowerCase();
  if (unit === 'mi' || unit === 'miles') return value;
  return Math.round(value * 0.621371 * 10) / 10;
}

export function matchesSearchFilters(
  rec: RawSearchPayload,
  filters: SearchFilterParams,
  facilitiesBySlug: Map<string, FacilityRecord>,
): boolean {
  if (filters.themeSlug && rec.theme?.slug !== filters.themeSlug) return false;

  if (filters.themeVariantSlugs?.length && !filters.themeVariantSlugs.includes(rec.themeVariant?.slug ?? '')) {
    return false;
  }

  if (filters.facilitySlugs?.length) {
    const text = getFacilityText(rec);
    const hasAll = filters.facilitySlugs.every((slug) => {
      const label = facilitiesBySlug.get(slug)?.label?.toLowerCase();
      return text.includes(slug) || (!!label && text.includes(label));
    });
    if (!hasAll) return false;
  }

  const wantsRouteOnlyFilter = !!(
    filters.routeDifficulty?.length ||
    filters.routeType?.length ||
    filters.routeMaxLengthMiles != null ||
    filters.routeSuitability?.length
  );

  if (rec.opportunityType === 'route') {
    const route = rec as OpportunityRouteV2;

    if (filters.routeDifficulty?.length) {
      const difficulty = (route.routeDifficulty ?? '').toLowerCase();
      if (!filters.routeDifficulty.some((d) => d.toLowerCase() === difficulty)) return false;
    }

    if (filters.routeType?.length && !filters.routeType.includes(route.routeType ?? '')) {
      return false;
    }

    if (filters.routeMaxLengthMiles != null) {
      const miles = parseDistanceMiles(route.routeDistance);
      if (miles != null && miles > filters.routeMaxLengthMiles) return false;
    }

    if (filters.routeSuitability?.length) {
      const wantedKeys = filters.routeSuitability.map((v) => SUITABILITY_FILTER_TO_KEY[v]).filter(Boolean);
      if (wantedKeys.length > 0) {
        const actual = resolveRouteSuitability(
          { ...route, opportunityType: 'route' } as unknown as EnrichedScoredRecommendationV2,
        );
        if (!wantedKeys.every((k) => actual.includes(k))) return false;
      }
    }
  } else if (wantsRouteOnlyFilter) {
    // Route-only filters were requested but this record isn't a route.
    return false;
  }

  if (filters.attractions?.length) {
    const text = getAttractionsText(rec);
    const hasAll = filters.attractions.every((slug) => {
      const keyword = ATTRACTION_LABELS[slug];
      return keyword ? text.includes(keyword) : text.includes(slug.replace(/_/g, ' '));
    });
    if (!hasAll) return false;
  }

  return true;
}
