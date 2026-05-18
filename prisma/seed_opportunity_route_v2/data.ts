import type { OpportunityRouteV2SeedInput } from "./create_opportunity_route_v2_row.js";

/**
 * Demo route v2 import rows (Exe / Devon area). `themeSlug` / `themeVariantSlug`
 * match `prisma/seed_opportunity_themes.ts` for `recordType: route`.
 *
 * Spreadsheet “variant” cells that list multiple labels map to a single FK:
 * we pick the first matching variant slug.
 */
export const opportunityRouteV2SeedRows: OpportunityRouteV2SeedInput[] = [
  {
    opportunityType: "route",
    themeSlug: "scenic_walks_and_wanders",
    // "Woodland Walk, Nature Trail" → first variant
    themeVariantSlug: "woodland_walk",
    routeName: "Haldon Forest Discovery Trail",
    routeActivityGrouping: "Simple Reset, Energy Burner, Low Effort",
    routeDescription:
      "A gentle loop around Haldon Forest that offers interactive features and stunning views across the forest, ideal for a simple family outing & mini adventure.",
    routeType: "Circular",
    routeDistance: "1.5",
    routeTerrainType: "Mixed terrain, Gravel, Woodland track",
    routeDifficulty: "Easy",
    routeAddressLine1: "Bullers Hill",
    routeAddressLine2: "Kennford",
    routeRegion: "Exeter",
    routePostcode: "EX6 7XR",
    routeCountry: "England",
    routeParkingProvision: "Paid Car Park",
    routeGeneralFacilities:
      "Toilets, Baby changing, Picnic Benches, Bench Seating, Dogs Allowed",
    routeChildFacilities:
      "Activity sheets, Children’s trail, Clues / games, Sandpit, Outdoor play equipment, \"Swings, Slides, Climbing Frames\"",
    routeAdultFacilities: "Hot Drinks, Hot & Cold food, Snacks",
    routeDogFacilities: "Dogs On Leads",
    routeAgeSuitabilityUnder1S: true,
    routeAgeSuitability1To2Years: true,
    routeAgeSuitability3To4Years: true,
    routeAgeSuitability5To7Years: true,
    routeAgeSuitability8To12Years: true,
    routeAgeSuitabilityOver13Years: true,
    routeAgeSuitabilityAdults: true,
    routePhysicalSetting: "Outside",
    routeDetailedWeatherSuitability:
      "Raining / wet, Sunshine, Overcast / cloudy, Dry & mild, Dry & cold, Dry & warm, Dry & hot",
    routeEstimatedDuration: "1-2hrs",
    routeInterestTags:
      "Woodland trail, trail network, pine forest, Gruffalo trail, activity sheet, balance bikes, road-free route, picnic spots, lookouts",
    routeSeasonalTag: "Autumn colours",
    routeSeasonalHighlights:
      "Autumn Leaves, \"Berries, Nuts, Conkers\"",
    routeAttractions:
      "Panoramic views, Wildlife spotting, Waymarked features (e.g. sculpture trail)",
    routeExtraKit:
      "XC Buggy, Sling / baby carrier, Infant / toddler carrier, Wellies, Sturdy footwear",
    image: "Haldon Forest.JPG",
  },
  {
    opportunityType: "route",
    themeSlug: "wheels_and_rideable_routes",
    themeVariantSlug: "longer_ride",
    routeName: "Powderham Church to Turf Locks",
    routeActivityGrouping: "Simple Reset, Energy Burner",
    routeDescription:
      "Venture onto this pretty route along the Exe Estuary with caution at weekends where cyclists are known to speed along. Picnic spots and benches dot it's route, stretching from Dawlish into Exeter at its full length. This stretch starts at Powderham Church, ending at Turf Locks pub; a stone's throw from the small ferry boat into Topsham.",
    routeType: "Out-and-back",
    routeDistance: "2.6",
    routeTerrainType: "Surfaced / smooth, Flat",
    routeDifficulty: "Moderate",
    routeAddressLine1: "St Clement's Church",
    routeAddressLine2: "Powderham",
    routeRegion: "Exeter",
    routePostcode: "EX6 8JJ",
    routeCountry: "England",
    routeParkingProvision: "On-street / nearby parking",
    routeGeneralFacilities: "Dogs Allowed",
    routeAgeSuitabilityUnder1S: true,
    routeAgeSuitability1To2Years: true,
    routeAgeSuitability3To4Years: true,
    routeAgeSuitability5To7Years: true,
    routeAgeSuitability8To12Years: true,
    routeAgeSuitabilityOver13Years: true,
    routeAgeSuitabilityAdults: true,
    routePhysicalSetting: "Outside",
    routeDetailedWeatherSuitability:
      "Sunshine, Overcast / cloudy, Dry & mild, Dry & cold, Dry & warm, Dry & hot, Windy (> X mph)",
    routeEstimatedDuration: "2-3hrs",
    routeInterestTags: "River walk route, estuary views",
    routeAttractions:
      "Riverside stretches, Scooter-friendly, Traffic-free sections",
    image: "Turf Locks to Exton Trail.JPG",
  },
  {
    opportunityType: "route",
    themeSlug: "scenic_walks_and_wanders",
    themeVariantSlug: "riverside_walk",
    routeName: "Parke River Route",
    routeActivityGrouping: "Energy Burner",
    routeDescription:
      "Park at Parke and head downhill past the cafe towards the river. Loop through the woodlands and across the river Bovey which runs through the estate, with plenty of places for pooh sticks, river paddling and woodland exploring on route. A tranquil setting often noted for its birdsong and wildflowers, and a well-stock National Trust cafe close to the carpark.",
    routeType: "Circular",
    routeDistance: "1.8",
    routeTerrainType: "Uneven, Woodland track",
    routeDifficulty: "Easy",
    routeAddressLine1: "Parke Estate",
    routeAddressLine2: "Bovey Tracey",
    routeRegion: "Devon",
    routePostcode: "TQ13 9JQ",
    routeCountry: "England",
    routeParkingProvision: "Paid Car Park",
    routeGeneralFacilities: "Dogs Allowed, Toilets",
    routeAdultFacilities: "Hot Drinks, Snacks",
    routeAgeSuitabilityUnder1S: true,
    routeAgeSuitability1To2Years: true,
    routeAgeSuitability3To4Years: true,
    routeAgeSuitability5To7Years: true,
    routeAgeSuitability8To12Years: true,
    routeAgeSuitabilityOver13Years: true,
    routeAgeSuitabilityAdults: true,
    routePhysicalSetting: "Outside",
    routeDetailedWeatherSuitability:
      "Raining / wet, Sunshine, Overcast / cloudy, Dry & mild, Dry & cold, Dry & warm, Dry & hot",
    routeEstimatedDuration: "1-2hrs",
    routeInterestTags:
      "Woodland trail, birdspotting, activity sheet, road-free route, picnic spots, wildflowers, river beaches, paddling spots, secluded spot, National Trust, kitchen garden",
    routeSeasonalTag: "Autumn colours, Spring flowers, Winter",
    routeSeasonalHighlights:
      "Bluebells, Daffodills, Birdsong, Kingfisher Spotting, Dragonflies & Damselflies, Fungi, Autumn Leaves, \"Berries, Nuts, Conkers\", Snowdrops",
    routeAttractions:
      "Rivers & streams, Natural paddling spots, Countryside views, Wildlife spotting",
    routeExtraKit:
      "XC Buggy, Sling / baby carrier, Infant / toddler carrier, Water shoes, Fishing nets",
    image: "Park Estate River Walk.JPG",
  },
  {
    opportunityType: "route",
    themeSlug: "scenic_walks_and_wanders",
    // "Coastal & Clifftop Walk, Local Wander"
    themeVariantSlug: "coastal_walk",
    routeName: "Lympstone to Exmouth Exe Estuary Trail",
    routeActivityGrouping: "Energy Burner, Low Effort, Simple Reset",
    routeDescription:
      "Follow the Exe Estuary along the coast from the pictureqsue centre of Lympstone village along the Estuary trail toward Exmouth. A mix of tarmac and decking, this is a simple route that can be extended or shortened depending on energy levels, with train stations at either end of the route.",
    routeType: "Out-and-back",
    routeDistance: "3",
    routeTerrainType: "Flat, Surfaced / smooth",
    routeDifficulty: "Easy",
    routeAddressLine1: "Lympstone Railway Station, The Strand",
    routeAddressLine2: "Lympstone",
    routeRegion: "Exmouth",
    routePostcode: "EX8 5JW",
    routeCountry: "England",
    routeParkingProvision: "On-street / nearby parking",
    routeGeneralFacilities: "Bench Seating, Dogs Allowed",
    routeAgeSuitabilityUnder1S: true,
    routeAgeSuitability1To2Years: true,
    routeAgeSuitability3To4Years: true,
    routeAgeSuitability5To7Years: true,
    routeAgeSuitability8To12Years: true,
    routeAgeSuitabilityOver13Years: true,
    routeAgeSuitabilityAdults: true,
    routePhysicalSetting: "Outside",
    routeDetailedWeatherSuitability:
      "Sunshine, Overcast / cloudy, Dry & mild, Dry & cold, Dry & warm, Dry & hot",
    routeEstimatedDuration: "1-2hrs",
    routeInterestTags: "Exe Estuary trail, cycle route",
    routeAttractions: "Coastal views, Countryside views",
    image: "Lymstone to Exmouth Exe Estuary Trail.JPG",
  },
  {
    opportunityType: "route",
    themeSlug: "scenic_walks_and_wanders",
    // "Local Wander, Coastal & Clifftop Walk" → first label
    themeVariantSlug: "gentle_wander",
    routeName: "Exmouth to Lympstone Exe Estuary Trail",
    routeActivityGrouping: "Energy Burner, Low Effort, Simple Reset",
    routeDescription:
      "Follow the Exe Estuary along the coast from Exmouth to the village centre of Lympstone village. Walk or cycle your way along the trail on a mix of tarmac and decking. This a simple route that can be extended or shortened depending on energy levels, with train stations at either end of the route, and a brilliant local cafe in Lympstone.",
    routeType: "Out-and-back",
    routeDistance: "3",
    routeTerrainType: "Flat, Surfaced / smooth",
    routeDifficulty: "Easy",
    routeAddressLine1: "36 Capel Ln",
    routeRegion: "Exmouth",
    routePostcode: "EX8 2QZ",
    routeCountry: "England",
    routeParkingProvision: "On-street / nearby parking",
    routeGeneralFacilities: "Bench Seating, Dogs Allowed",
    routeAgeSuitabilityUnder1S: true,
    routeAgeSuitability1To2Years: true,
    routeAgeSuitability3To4Years: true,
    routeAgeSuitability5To7Years: true,
    routeAgeSuitability8To12Years: true,
    routeAgeSuitabilityOver13Years: true,
    routeAgeSuitabilityAdults: true,
    routePhysicalSetting: "Outside",
    routeDetailedWeatherSuitability:
      "Sunshine, Overcast / cloudy, Dry & mild, Dry & cold, Dry & warm, Dry & hot",
    routeEstimatedDuration: "1-2hrs",
    routeInterestTags: "Exe Estuary trail, cycle route",
    routeAttractions: "Coastal views, Countryside views",
    image: "Exmouth to Lympstone Exe Estuary Trail.JPG",
  },
];
