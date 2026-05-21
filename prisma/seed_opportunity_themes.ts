import { DeleteCommand, PutCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from "uuid";
import db from "../api/database/database.config.js";
import { TABLES } from "../api/database/tables.js";

export type OpportunityRecordType = "route" | "venue" | "club" | "event";

const THEME_SLUG_BY_TYPE: Record<string, OpportunityRecordType[]> = {
  scenic_walks_and_wanders: ["route", "club", "event"],
  wheels_and_rideable_routes: ["route", "venue", "club", "event"],
  nature_and_wildlife_exploration: ["route", "venue", "club", "event"],
  green_spaces_to_run_around: ["venue", "event"],
  coastal_adventures: ["venue", "club", "event"],
  gardens_and_curated_outdoor_spaces: ["venue", "event"],
  playgrounds_and_adventure_play: ["venue", "event"],
  sporty_activities: ["venue", "club", "event"],
  water_based_fun: ["venue", "club", "event"],
  creative_and_expressive_play: ["venue", "club", "event"],
  imaginative_and_role_play: ["venue", "club", "event"],
  sensory_or_calming_experiences: ["venue", "club", "event"],
  hands_on_learning: ["venue", "event"],
  interactive_museums_and_discovery: ["venue", "event"],
  historical_and_cultural_exploration: ["venue", "event"],
  animal_encounters: ["venue", "club", "event"],
  soft_play_and_indoor_energy: ["venue", "event"],
  indoor_entertainment: ["venue", "club", "event"],
  transport_and_engineering: ["venue", "club", "event"],
  a_big_day_out: ["venue", "event"],
  a_relaxed_coffee_stop: ["venue", "event"],
  family_dining: ["venue"],
};

const THEME_LABELS: Record<string, string> = {
  scenic_walks_and_wanders: "Scenic Walks & Wanders",
  wheels_and_rideable_routes: "Wheels & Rideable Routes",
  nature_and_wildlife_exploration: "Nature & Wildlife Exploration",
  green_spaces_to_run_around: "Green Spaces to Run Around",
  coastal_adventures: "Coastal Adventures",
  gardens_and_curated_outdoor_spaces: "Gardens & Curated Outdoor Spaces",
  playgrounds_and_adventure_play: "Playgrounds & Adventure Play",
  sporty_activities: "Sporty Activities",
  water_based_fun: "Water-Based Fun",
  creative_and_expressive_play: "Creative & Expressive Play",
  imaginative_and_role_play: "Imaginative & Role Play",
  sensory_or_calming_experiences: "Sensory or Calming Experiences",
  hands_on_learning: "Hands-On Learning",
  interactive_museums_and_discovery: "Interactive Museums & Discovery",
  historical_and_cultural_exploration: "Historical & Cultural Exploration",
  animal_encounters: "Animal Encounters",
  soft_play_and_indoor_energy: "Soft Play & Indoor Energy",
  indoor_entertainment: "Indoor Entertainment",
  transport_and_engineering: "Transport & Engineering",
  a_big_day_out: "A Big Day Out",
  a_relaxed_coffee_stop: "A Relaxed Coffee Stop",
  family_dining: "Family Dining",
};

type VariantRow = {
  slug: string;
  name: string;
  recordTypes: OpportunityRecordType[];
  applicableTypes?: string;
  description?: string;
  isActive?: boolean;
};

const VARIANTS_BY_THEME: Record<string, VariantRow[]> = {
  scenic_walks_and_wanders: [
    { slug: "woodland_walk", name: "Woodland Walk", recordTypes: ["route"], description: "Tree-covered, shaded walks" },
    { slug: "coastal_walk", name: "Coastal & Clifftop Walk", recordTypes: ["route"], description: "Sea views, cliffs" },
    { slug: "riverside_walk", name: "River or Lakeside Ramble", recordTypes: ["route"], description: "Calm waterside walks" },
    { slug: "nature_trail", name: "Nature Trail", recordTypes: ["route"], description: "Signed or circular routes" },
    { slug: "feature_walk", name: "Feature Walk", recordTypes: ["route"], description: "Destination-led" },
    { slug: "gentle_wander", name: "Local Wander", recordTypes: ["route"], description: "Short, low-effort walks" },
    { slug: "hilly_hike", name: "Challenging Hike", recordTypes: ["route"], description: "Challenging hikes on tricky terrain" },
    { slug: "city_circuit", name: "City Circuit", recordTypes: ["route"], description: "Short loops in urban areas" },
    { slug: "towpaths", name: "Towpath", recordTypes: ["route"], description: "Simple towpaths" },
  ],
  green_spaces_to_run_around: [
    { slug: "country_parks", name: "Country Park", recordTypes: ["venue", "event"], description: "Big open parks with space to roam" },
    { slug: "open_parkland", name: "Parkland or Meadow", recordTypes: ["venue", "event"], description: "Wide, unfenced grassy areas" },
    { slug: "village_greens", name: "Village Green", recordTypes: ["venue", "event"], description: "Informal local green spaces" },
    { slug: "village_parks", name: "Village Park", recordTypes: ["venue", "event"], description: "Smaller local park options" },
    { slug: "urban_green_spaces", name: "Urban Green Space", recordTypes: ["venue", "event"], description: "City-based open green areas" },
    { slug: "estate_grounds", name: "Estate Grounds", recordTypes: ["venue", "event"], description: "Managed grounds open to the public" },
  ],
  nature_and_wildlife_exploration: [
    { slug: "nature_reserves", name: "Nature Reserve", recordTypes: ["route", "venue", "club", "event"], description: "Protected or unmanaged natural areas" },
    { slug: "wildlife_spotting", name: "Wildlife Hotspot", recordTypes: ["route", "venue", "club", "event"], description: "Birds, insects, deer" },
    { slug: "hydes_cabins", name: "Hydes or Cabins", recordTypes: ["route", "venue", "club", "event"], description: "Quiet observation" },
    { slug: "forest_school", name: "Forest School", recordTypes: ["route", "venue", "club", "event"], description: "Lightly structured, nature-first learning" },
    { slug: "natural_play_areas", name: "Natural Play Area", recordTypes: ["route", "venue", "club", "event"], description: "Play using natural materials" },
    { slug: "den_building", name: "Den-Building & Nature Craft", recordTypes: ["route", "venue", "club", "event"], description: "Hands-on interaction with nature" },
    { slug: "nature_trails", name: "Discovery Trail", recordTypes: ["route"], description: "Trails designed to encourage exploration" },
  ],
  coastal_adventures: [
    { slug: "sandy_beach", name: "Sandy Beach", recordTypes: ["venue", "club", "event"], description: "Sand-focused play" },
    { slug: "pebble_beach", name: "Pebble or Shingle Beach", recordTypes: ["venue", "club", "event"] },
    { slug: "rnli_beach", name: "RNLI Beach", recordTypes: ["venue", "club", "event"], description: "Safe water entry" },
    { slug: "coves_exploration", name: "Cove or Headland", recordTypes: ["venue", "club", "event"], description: "Smaller, enclosed bays" },
    { slug: "coasteering_adventure", name: "Coasteering Spot", recordTypes: ["venue", "club"], description: "Coasteering as an activity or ideal preferred spot" },
    { slug: "wild_open_beaches", name: "Wild & Open Beach", recordTypes: ["venue", "club", "event"], description: "Exposed, expansive beaches" },
    { slug: "sheltered_family", name: "Sheltered Family Beach", recordTypes: ["venue", "club", "event"], description: "Calm, protected beaches" },
    { slug: "dog_friendly_beaches", name: "Dog-Friendly Beach", recordTypes: ["venue", "club", "event"], description: "Dog access important" },
  ],
  gardens_and_curated_outdoor_spaces: [
    { slug: "botanical_gardens", name: "Botanical Garden", recordTypes: ["venue", "event"], description: "Plant collections" },
    { slug: "arboretum", name: "Arboretum", recordTypes: ["venue", "event"] },
    { slug: "historic_estate_gardens", name: "Historic Estate Garden", recordTypes: ["venue", "event"], description: "Manor, estate, heritage gardens" },
    { slug: "formal_landscape_gardens", name: "Landscaped Garden", recordTypes: ["venue", "event"], description: "Designed garden layouts" },
    { slug: "community_gardens", name: "Community Garden", recordTypes: ["venue", "event"], description: "Local gardens open to the public" },
    { slug: "themed_gardens", name: "Themed Garden", recordTypes: ["venue", "event"], description: "Art, sculpture, or concept-led gardens" },
    { slug: "enclosed_gardens", name: "Enclosed Garden", recordTypes: ["venue", "event"], description: "Contained, intimate spaces" },
  ],
  playgrounds_and_adventure_play: [
    { slug: "large_playgrounds", name: "Destination Playground", recordTypes: ["venue", "event"], description: "Big, well-equipped playgrounds" },
    { slug: "local_playgrounds", name: "Local park", recordTypes: ["venue", "event"], description: "Smaller, village parks" },
    { slug: "adventure_playgrounds", name: "Adventure Playground", recordTypes: ["venue", "event"], description: "More challenging, exploratory play" },
    { slug: "natural_play", name: "Natural Obstacle Course", recordTypes: ["venue", "event"], description: "Wood, ropes, nature-led design" },
    { slug: "skate_park", name: "Skate Park", recordTypes: ["venue", "event"], description: "Ramps, jumps, smoothed surface for skates" },
    { slug: "orienteering_course", name: "Orienteering Course", recordTypes: ["venue", "event"], description: "Height, obstacles, physical challenge" },
    { slug: "letterboxing_course", name: "Letterboxing Site", recordTypes: ["venue", "event"], description: "Fast-paced, physical play" },
  ],
  sporty_activities: [
    { slug: "leisure_centre", name: "Leisure Centre", recordTypes: ["venue", "club", "event"] },
    { slug: "climbing_centre", name: "Climbing Centre", recordTypes: ["venue", "club", "event"] },
    { slug: "multisports_activity_centre", name: "Multisports Centre", recordTypes: ["venue", "club", "event"] },
    { slug: "sports_stadium", name: "Sport Stadium", recordTypes: ["venue", "club", "event"] },
    { slug: "sports_arena", name: "Sport Arena", recordTypes: ["venue", "club", "event"] },
    { slug: "swimming_pool", name: "Swimming Pool", recordTypes: ["venue", "club", "event"] },
    { slug: "community_centre", name: "Community Centre", recordTypes: ["venue", "club", "event"] },
    { slug: "range", name: "Range", recordTypes: ["venue", "club", "event"] },
    { slug: "sports_track", name: "Sports Track", recordTypes: ["venue", "club", "event"] },
    { slug: "indoor_courts", name: "Indoor Court", recordTypes: ["venue", "club", "event"] },
    { slug: "outdoor_courts", name: "Outdoor Court", recordTypes: ["venue", "club", "event"] },
    { slug: "specialist_sports_facility", name: "Specialist Facility", recordTypes: ["venue", "club", "event"] },
    { slug: "outdoor_pitch", name: "Outdoor Pitch", recordTypes: ["venue", "club", "event"] },
    { slug: "gym", name: "Gym", recordTypes: ["venue", "club", "event"] },
  ],
  wheels_and_rideable_routes: [
    { slug: "quick_spin", name: "Quick spin", recordTypes: ["route"], description: "Easy win / quick reset energy" },
    { slug: "longer_ride", name: "Longer ride", recordTypes: ["route"], description: "A more committed outing" },
    { slug: "practise_route", name: "Practise Space", recordTypes: ["route", "venue", "club", "event"], description: "Learning, improving, settling nerves" },
    { slug: "skills_and_stunts", name: "Skills & Stunts Space", recordTypes: ["route", "venue", "club", "event"], description: "Pump tracks, ramps, jumps" },
  ],
  water_based_fun: [
    { slug: "paddle_spot", name: "Paddle Spot", recordTypes: ["venue", "club", "event"], description: "Paddling, shallow water, splashy play" },
    { slug: "water_play", name: "Water play", recordTypes: ["venue", "club", "event"], description: "Calm, low-risk, sensory water experiences" },
    { slug: "river_beach", name: "River Beach", recordTypes: ["venue", "club", "event"], description: "Calm water, shade, inland feel" },
    { slug: "water_park", name: "Waterparks", recordTypes: ["venue"], description: "Splash parks / fountains" },
    { slug: "water_rides", name: "On The Water", recordTypes: ["venue", "club", "event"] },
    { slug: "water_adventure", name: "Water Adventure", recordTypes: ["venue", "club", "event"], description: "Braver, exploratory water experiences" },
  ],
  creative_and_expressive_play: [
    { slug: "making_and_creating", name: "Creative Artwork", recordTypes: ["venue", "club", "event"], description: "Hands-on creative output: art, craft, clay, textiles" },
    { slug: "expressive_movement_and_music", name: "Music & Movement", recordTypes: ["venue", "club", "event"], description: "Singing, dancing, rhythm, performance" },
    { slug: "creative_expression", name: "Creative Expression", recordTypes: ["venue", "club", "event"], description: "Creative writing, poetry, spoken verse, storytelling" },
    { slug: "performing_and_putting_on_a_show", name: "Performative Arts", recordTypes: ["venue", "club", "event"], description: "Drama, theatre-style play" },
    { slug: "film_photography", name: "Film or Media", recordTypes: ["venue", "club", "event"], description: "Photography, film, creative documentation" },
  ],
  imaginative_and_role_play: [
    { slug: "role_play_and_characters", name: "Character-Led Play", recordTypes: ["venue", "club", "event"], description: "Dressing up through to character-led re-enactment" },
    { slug: "immersive_worlds", name: "Immersive Worlds", recordTypes: ["venue", "event"], description: "Depth and escapism" },
    { slug: "scenario_and_world_play", name: "Scenario & World play", recordTypes: ["venue", "club"], description: "Small-world play and complex scenario building" },
    { slug: "narrative_led_experiences", name: "Narrative-led experiences", recordTypes: ["venue", "event"], description: "Story-driven experiences" },
  ],
  sensory_or_calming_experiences: [
    { slug: "sensory_garden", name: "Sensory garden", recordTypes: ["venue"], description: "Outdoor, designed-for-senses, calming by intent" },
    { slug: "sensory_room_or_space", name: "Sensory Space", recordTypes: ["venue"], description: "Dedicated indoor sensory rooms or calming spaces" },
    { slug: "calming_designed_environment", name: "Soothing Environment", recordTypes: ["venue", "event"], description: "Intentionally gentle environments or installations" },
    { slug: "light_touch_sensory_experience", name: "Light-touch Sensory", recordTypes: ["venue", "event"], description: "Sensory-focused but not intense or overwhelming" },
  ],
  hands_on_learning: [
    { slug: "experiments", name: "Experiments", recordTypes: ["venue", "event"], description: "Science-style exploration, trial & error" },
    { slug: "discovery_challenges", name: "Discovery-Based Challenges", recordTypes: ["venue", "event"] },
    { slug: "learning_through_play", name: "Learning Through Play", recordTypes: ["venue", "event"], description: "Play-led learning environments" },
    { slug: "interactive_exhibits", name: "Interactive Exhibits", recordTypes: ["venue", "event"], description: "Touch, build, manipulate" },
    { slug: "problem_solving", name: "Problem-Solving", recordTypes: ["venue", "event"], description: "Puzzles, logic, engineering-style tasks" },
    { slug: "construction_activity", name: "Construction Activities", recordTypes: ["venue", "event"], description: "Constructing, assembling, creating" },
  ],
  interactive_museums_and_discovery: [
    { slug: "science_and_discovery", name: "Science & Discovery", recordTypes: ["venue", "event"], description: "Science centres, discovery museums" },
    { slug: "technology_and_innovation", name: "Technology & Innovation", recordTypes: ["venue", "event"], description: "Tech, engineering, innovation spaces" },
    { slug: "history_made_interactive", name: "History & Pastimes", recordTypes: ["venue", "event"], description: "History presented interactively" },
    { slug: "world_and_cultures", name: "World & Cultures", recordTypes: ["venue", "event"], description: "Geography, people, global cultures" },
    { slug: "children_focused_discovery", name: "Child-Focused Discovery", recordTypes: ["venue", "event"], description: "Designed specifically for children" },
  ],
  animal_encounters: [
    { slug: "farm_and_smallholding", name: "Farm or Smallholding", recordTypes: ["venue", "event"], description: "Petting farms, open farms, smallholdings" },
    { slug: "wildlife_reserve", name: "Wildlife Reserve", recordTypes: ["venue"] },
    { slug: "animal_parks", name: "Animal Parks & Zoos", recordTypes: ["venue"], description: "Zoos, safari parks, wildlife parks" },
    { slug: "conservation_project", name: "Conservation Project", recordTypes: ["venue"], isActive: true },
    { slug: "animal_sanctuary", name: "Animal Sanctuary", recordTypes: ["venue", "club", "event"] },
    { slug: "sealife_aquarium", name: "Marine Aquarium", recordTypes: ["venue", "event"], description: "Aquatic animal centres" },
    { slug: "reptiles_and_exotics", name: "Reptiles & Exotics", recordTypes: ["venue"], description: "Reptile centres, specialist collections" },
    { slug: "birds_of_prey", name: "Bird of Prey Centre", recordTypes: ["venue", "event"] },
    { slug: "stables_yard", name: "Stables or Yard", recordTypes: ["venue", "club"], description: "Riding, grooming, pony encounters" },
  ],
  historical_and_cultural_exploration: [
    { slug: "ancient_sites", name: "Ancient Site", recordTypes: ["venue"], description: "Castles, fortresses, ruins" },
    { slug: "historic_houses", name: "Historic Estate", recordTypes: ["venue", "event"], description: "Manor houses, estates, heritage homes" },
    { slug: "living_history", name: "Living History", recordTypes: ["venue", "event"], description: "Re-enactment, costumed history" },
    { slug: "open_museum", name: "Open-Air Museum", recordTypes: ["venue", "event"] },
    { slug: "industrial_history", name: "Industrial & Working History", recordTypes: ["venue", "event"], description: "Mills, railways, mines, docks" },
    { slug: "archaeological_sites", name: "Archaeological", recordTypes: ["venue", "event"], description: "Fossil spots, archaeological sites of interest" },
    { slug: "cultural_heritage", name: "Cultural Heritage Site", recordTypes: ["venue", "event"], description: "Cultural exhibitions, heritage centres" },
    { slug: "historic_religious", name: "Historic Religious Building", recordTypes: ["venue", "event"], description: "Cathedrals, abbeys, historic churches" },
  ],
  soft_play_and_indoor_energy: [
    { slug: "large_soft_play", name: "Soft Play Centre", recordTypes: ["venue", "event"], description: "Multi-level, slides, big structures" },
    { slug: "toddler_soft_play", name: "Toddler Play Space", recordTypes: ["venue", "event"], description: "Designed for under 5s" },
    { slug: "indoor_climbing", name: "Indoor Climbing", recordTypes: ["venue", "event"], description: "Climbing walls, obstacle-style energy" },
    { slug: "indoor_course", name: "Inside Course", recordTypes: ["venue", "event"], description: "Assault course, ninja course, obstacles" },
    { slug: "trampoline_park", name: "Trampoline Park", recordTypes: ["venue", "event"], description: "Trampolines, bounce parks" },
    { slug: "indoor_multi_activity", name: "Multi-Activity Centre", recordTypes: ["venue", "event"], description: "Mixed zones: soft play + trampolines etc" },
  ],
  indoor_entertainment: [
    { slug: "cinema", name: "Cinema", recordTypes: ["event", "club"] },
    { slug: "theatre_panto", name: "Stage-Show", recordTypes: ["event", "club"] },
    { slug: "live_events", name: "Live Events", recordTypes: ["event", "club"] },
    { slug: "gaming", name: "Gaming & VR", recordTypes: ["venue", "event", "club"] },
    { slug: "comedy_club", name: "Improvised Performance", recordTypes: ["event", "club"] },
    { slug: "bowling_alley", name: "Bowling", recordTypes: ["venue", "event", "club"] },
  ],
  transport_and_engineering: [
    { slug: "trains_and_rail", name: "Trains & Railways", recordTypes: ["venue", "club", "event"], description: "Steam, heritage, miniature railways" },
    { slug: "boat_trips", name: "Boat Trips & Ferries", recordTypes: ["venue", "club", "event"], description: "Ferries, sightseeing boat trips" },
    { slug: "harbours_and_marinas", name: "Harbours & Marinas", recordTypes: ["venue", "club", "event"], description: "Watching boats, ports, docks" },
    { slug: "aviation_experiences", name: "Aircraft & Aviation", recordTypes: ["venue", "club", "event"], description: "Museums, viewing areas, airfields" },
    { slug: "transport_museums", name: "Transport Museum", recordTypes: ["venue", "club", "event"], description: "Cars, buses, mixed vehicle collections" },
    { slug: "working_transport_hubs", name: "Working Transport Hubs", recordTypes: ["venue", "club", "event"], description: "Stations, depots, logistics hubs" },
  ],
  a_big_day_out: [
    { slug: "themepark", name: "Themepark", recordTypes: ["venue"], description: "Ride-based parks" },
    { slug: "amusement_park", name: "Amusement Park", recordTypes: ["venue"], description: "Arcades" },
    { slug: "major_animal_attractions", name: "Major Animal Attractions", recordTypes: ["venue"], description: "Zoos, safari parks" },
    { slug: "large_scale_outdoor", name: "Large-Scale Outdoor Attractions", recordTypes: ["venue"], description: "Estates, expansive outdoor sites" },
    { slug: "major_indoor", name: "Major Indoor Attractions", recordTypes: ["venue"], description: "Large indoor destinations" },
    { slug: "seasonal_and_themed", name: "Seasonal & Themed Events", recordTypes: ["venue", "event"], description: "Christmas trails, festivals, themed days" },
  ],
  a_relaxed_coffee_stop: [
    { slug: "family_friendly_cafes", name: "Family-Friendly Cafés", recordTypes: ["venue", "event"], description: "Welcoming, space for kids" },
    { slug: "cafe_with_play", name: "Quiet Cafés", recordTypes: ["venue"], description: "Toys, books, colouring" },
    { slug: "cafe_with_outdoor_space", name: "Cafés with Outdoor Space", recordTypes: ["venue"], description: "Gardens, courtyards, terraces" },
    { slug: "coffee_cabin", name: "Coffee Cabin / Truck", recordTypes: ["venue"], description: "Small mobile coffee stations with nearby seating / views" },
    { slug: "pit_stop_cafes", name: "Easy Pit-Stops", recordTypes: ["venue"], description: "On routes, parks, attractions" },
  ],
  family_dining: [
    { slug: "casual_family_restaurants", name: "Family Eateries", recordTypes: ["venue"], description: "Relaxed, unfussy, welcoming" },
    { slug: "dining_with_space", name: "Outdoor Family Dining", recordTypes: ["venue"], description: "Gardens, play corners, outdoor areas" },
    { slug: "destination_dining", name: "Destination Family Dining", recordTypes: ["venue"], description: "Food as part of a wider outing" },
    { slug: "food_festival", name: "Food Festivals", recordTypes: ["venue"] },
  ],
};

async function clearTable(tableName: string) {
  let lastKey: Record<string, unknown> | undefined;
  do {
    const res = await db.send(
      new ScanCommand({
        TableName: tableName,
        ProjectionExpression: "id",
        ...(lastKey ? { ExclusiveStartKey: lastKey } : {}),
      }),
    );
    for (const item of res.Items ?? []) {
      await db.send(new DeleteCommand({ TableName: tableName, Key: { id: item.id } }));
    }
    lastKey = res.LastEvaluatedKey as Record<string, unknown> | undefined;
  } while (lastKey);
}

export async function seedOpportunityThemes(): Promise<void> {
  await clearTable(TABLES.opportunityThemeVariants);
  await clearTable(TABLES.opportunityThemes);

  const now = new Date().toISOString();
  const themeIdByKey = new Map<string, string>();
  let themeCount = 0;
  let variantCount = 0;

  for (const [themeSlug, recordTypes] of Object.entries(THEME_SLUG_BY_TYPE)) {
    const name = THEME_LABELS[themeSlug];
    const orderByType = new Map<string, number>();

    for (const recordType of recordTypes) {
      const id = uuidv4();
      const sortOrder = orderByType.get(recordType) ?? 0;
      orderByType.set(recordType, sortOrder + 1);

      await db.send(
        new PutCommand({
          TableName: TABLES.opportunityThemes,
          Item: { id, slug: themeSlug, name, recordType, isActive: true, sortOrder, createdAt: now, updatedAt: now },
        }),
      );
      themeIdByKey.set(`${recordType}:${themeSlug}`, id);
      themeCount++;
    }
  }

  for (const [themeSlug, variants] of Object.entries(VARIANTS_BY_THEME)) {
    const orderByThemeId = new Map<string, number>();

    for (const v of variants) {
      for (const recordType of v.recordTypes) {
        const themeId = themeIdByKey.get(`${recordType}:${themeSlug}`);
        if (!themeId) {
          console.warn(`Skipping variant ${v.slug}: no theme ${recordType}:${themeSlug}`);
          continue;
        }
        const sortOrder = orderByThemeId.get(themeId) ?? 0;
        orderByThemeId.set(themeId, sortOrder + 1);

        await db.send(
          new PutCommand({
            TableName: TABLES.opportunityThemeVariants,
            Item: {
              id: uuidv4(),
              themeId,
              slug: v.slug,
              name: v.name,
              applicableTypes: v.applicableTypes ?? null,
              description: v.description ?? null,
              isActive: v.isActive ?? true,
              sortOrder,
              createdAt: now,
              updatedAt: now,
            },
          }),
        );
        variantCount++;
      }
    }
  }

  console.log(`Seeded ${themeCount} opportunity themes and ${variantCount} variants.`);
}
