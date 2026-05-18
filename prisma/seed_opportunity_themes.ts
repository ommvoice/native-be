import type { PrismaClient } from "@prisma/client";
import { OpportunityRecordType } from "@prisma/client";

type RT = OpportunityRecordType;

const R = OpportunityRecordType;

/** Parent themes exist on these record types for this slug. */
const THEME_SLUG_BY_TYPE = {
  scenic_walks_and_wanders: [R.route, R.club, R.event],
  wheels_and_rideable_routes: [R.route, R.venue, R.club, R.event],
  nature_and_wildlife_exploration: [R.route, R.venue, R.club, R.event],
  green_spaces_to_run_around: [R.venue, R.event],
  coastal_adventures: [R.venue, R.club, R.event],
  gardens_and_curated_outdoor_spaces: [R.venue, R.event],
  playgrounds_and_adventure_play: [R.venue, R.event],
  sporty_activities: [R.venue, R.club, R.event],
  water_based_fun: [R.venue, R.club, R.event],
  creative_and_expressive_play: [R.venue, R.club, R.event],
  imaginative_and_role_play: [R.venue, R.club, R.event],
  sensory_or_calming_experiences: [R.venue, R.club, R.event],
  hands_on_learning: [R.venue, R.event],
  interactive_museums_and_discovery: [R.venue, R.event],
  historical_and_cultural_exploration: [R.venue, R.event],
  animal_encounters: [R.venue, R.club, R.event],
  soft_play_and_indoor_energy: [R.venue, R.event],
  indoor_entertainment: [R.venue, R.club, R.event],
  transport_and_engineering: [R.venue, R.club, R.event],
  a_big_day_out: [R.venue, R.event],
  a_relaxed_coffee_stop: [R.venue, R.event],
  family_dining: [R.venue],
} as const satisfies Record<string, readonly RT[]>;

type ThemeSlug = keyof typeof THEME_SLUG_BY_TYPE;

const THEME_LABELS: Record<ThemeSlug, string> = {
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
  /** Where this row should be inserted (parent theme must exist for each). */
  recordTypes: readonly RT[];
  applicableTypes?: string;
  description?: string;
  isActive?: boolean;
};

function themesToCreate(): {
  recordType: RT;
  slug: string;
  name: string;
  sortOrder: number;
  isActive: boolean;
}[] {
  const out: {
    recordType: RT;
    slug: string;
    name: string;
    sortOrder: number;
    isActive: boolean;
  }[] = [];
  const orderByType = new Map<RT, number>();

  for (const slug of Object.keys(THEME_SLUG_BY_TYPE) as ThemeSlug[]) {
    const name = THEME_LABELS[slug];
    for (const recordType of THEME_SLUG_BY_TYPE[slug]) {
      const next = orderByType.get(recordType) ?? 0;
      orderByType.set(recordType, next + 1);
      out.push({
        recordType,
        slug,
        name,
        sortOrder: next,
        isActive: true,
      });
    }
  }
  return out;
}

const VARIANTS_BY_THEME: Record<ThemeSlug, VariantRow[]> = {
  scenic_walks_and_wanders: [
    {
      slug: "woodland_walk",
      name: "Woodland Walk",
      recordTypes: [R.route],
      applicableTypes: "route",
      description: "Tree-covered, shaded walks",
    },
    {
      slug: "coastal_walk",
      name: "Coastal & Clifftop Walk",
      recordTypes: [R.route],
      applicableTypes: "route",
      description: "Sea views, cliffs",
    },
    {
      slug: "riverside_walk",
      name: "River or Lakeside Ramble",
      recordTypes: [R.route],
      applicableTypes: "route",
      description: "Calm waterside walks",
    },
    {
      slug: "nature_trail",
      name: "Nature Trail",
      recordTypes: [R.route],
      applicableTypes: "route",
      description: "Signed or circular routes",
    },
    {
      slug: "feature_walk",
      name: "Feature Walk",
      recordTypes: [R.route],
      applicableTypes: "route",
      description: "Destination-led",
    },
    {
      slug: "gentle_wander",
      name: "Local Wander",
      recordTypes: [R.route],
      applicableTypes: "route",
      description: "Short, low-effort walks",
    },
    {
      slug: "hilly_hike",
      name: "Challenging Hike",
      recordTypes: [R.route],
      applicableTypes: "route",
      description: "Challenging hikes on tricky terrain",
    },
    {
      slug: "city_circuit",
      name: "City Circuit",
      recordTypes: [R.route],
      applicableTypes: "route",
      description: "Short loops in urban areas",
    },
    {
      slug: "towpaths",
      name: "Towpath",
      recordTypes: [R.route],
      applicableTypes: "route",
      description: "Simple towpaths",
    },
  ],

  green_spaces_to_run_around: [
    {
      slug: "country_parks",
      name: "Country Park",
      recordTypes: [R.venue, R.event],
      applicableTypes: "all",
      description: "Big open parks with space to roam",
    },
    {
      slug: "open_parkland",
      name: "Parkland or Meadow",
      recordTypes: [R.venue, R.event],
      applicableTypes: "all",
      description: "Wide, unfenced grassy areas",
    },
    {
      slug: "village_greens",
      name: "Village Green",
      recordTypes: [R.venue, R.event],
      applicableTypes: "all",
      description: "Informal local green spaces",
    },
    {
      slug: "village_parks",
      name: "Village Park",
      recordTypes: [R.venue, R.event],
      applicableTypes: "all",
      description:
        "Smaller local park options usually with some greenspace",
    },
    {
      slug: "urban_green_spaces",
      name: "Urban Green Space",
      recordTypes: [R.venue, R.event],
      applicableTypes: "all",
      description: "City-based open green areas",
    },
    {
      slug: "estate_grounds",
      name: "Estate Grounds",
      recordTypes: [R.venue, R.event],
      applicableTypes: "all",
      description: "Managed grounds open to the public",
    },
  ],

  nature_and_wildlife_exploration: [
    {
      slug: "nature_reserves",
      name: "Nature Reserve",
      recordTypes: [R.route, R.venue, R.club, R.event],
      applicableTypes: "all, route",
      description: "Protected or unmanaged natural areas",
    },
    {
      slug: "wildlife_spotting",
      name: "Wildlife Hotspot",
      recordTypes: [R.route, R.venue, R.club, R.event],
      applicableTypes: "all",
      description: "Birds, insects, deer",
    },
    {
      slug: "hydes_cabins",
      name: "Hydes or Cabins",
      recordTypes: [R.route, R.venue, R.club, R.event],
      applicableTypes: "all",
      description: "Quiet observation",
    },
    {
      slug: "forest_school",
      name: "Forest School",
      recordTypes: [R.route, R.venue, R.club, R.event],
      applicableTypes: "all",
      description: "Lightly structured, nature-first learning",
    },
    {
      slug: "natural_play_areas",
      name: "Natural Play Area",
      recordTypes: [R.route, R.venue, R.club, R.event],
      applicableTypes: "all",
      description:
        "Play using natural materials, wild, unmanaged spaces",
    },
    {
      slug: "den_building",
      name: "Den-Building & Nature Craft",
      recordTypes: [R.route, R.venue, R.club, R.event],
      applicableTypes: "all",
      description: "Hands-on interaction with nature",
    },
    {
      slug: "nature_trails",
      name: "Discovery Trail",
      recordTypes: [R.route],
      applicableTypes: "route",
      description: "Trails designed to encourage exploration",
    },
  ],

  coastal_adventures: [
    {
      slug: "sandy_beach",
      name: "Sandy Beach",
      recordTypes: [R.venue, R.club, R.event],
      applicableTypes: "all",
      description: "Sand-focused play",
    },
    {
      slug: "pebble_beach",
      name: "Pebble or Shingle Beach",
      recordTypes: [R.venue, R.club, R.event],
      applicableTypes: "all",
    },
    {
      slug: "rnli_beach",
      name: "RNLI Beach",
      recordTypes: [R.venue, R.club, R.event],
      applicableTypes: "all",
      description: "Safe water entry",
    },
    {
      slug: "coves_exploration",
      name: "Cove or Headland",
      recordTypes: [R.venue, R.club, R.event],
      applicableTypes: "all",
      description: "Smaller, enclosed bays",
    },
    {
      slug: "coasteering_adventure",
      name: "Coasteering Spot",
      recordTypes: [R.venue, R.club],
      applicableTypes: "club, experience, venue",
      description:
        "Coasteering as an activity or ideal preferred spot",
    },
    {
      slug: "wild_open_beaches",
      name: "Wild & Open Beach",
      recordTypes: [R.venue, R.club, R.event],
      applicableTypes: "all",
      description: "Exposed, expansive beaches",
    },
    {
      slug: "sheltered_family",
      name: "Sheltered Family Beach",
      recordTypes: [R.venue, R.club, R.event],
      applicableTypes: "all",
      description: "Calm, protected beaches",
    },
    {
      slug: "dog_friendly_beaches",
      name: "Dog-Friendly Beach",
      recordTypes: [R.venue, R.club, R.event],
      applicableTypes: "all",
      description: "Dog access important",
    },
  ],

  gardens_and_curated_outdoor_spaces: [
    {
      slug: "botanical_gardens",
      name: "Botanical Garden",
      recordTypes: [R.venue, R.event],
      applicableTypes: "venue",
      description: "Plant collections",
    },
    {
      slug: "arboretum",
      name: "Arboretum",
      recordTypes: [R.venue, R.event],
      applicableTypes: "venue",
    },
    {
      slug: "historic_estate_gardens",
      name: "Historic Estate Garden",
      recordTypes: [R.venue, R.event],
      applicableTypes: "venue",
      description: "Manor, estate, heritage gardens",
    },
    {
      slug: "formal_landscape_gardens",
      name: "Landscaped Garden",
      recordTypes: [R.venue, R.event],
      applicableTypes: "venue",
      description: "Designed garden layouts",
    },
    {
      slug: "community_gardens",
      name: "Community Garden",
      recordTypes: [R.venue, R.event],
      applicableTypes: "venue",
      description: "Local gardens open to the public",
    },
    {
      slug: "themed_gardens",
      name: "Themed Garden",
      recordTypes: [R.venue, R.event],
      applicableTypes: "venue",
      description: "Art, sculpture, or concept-led gardens",
    },
    {
      slug: "enclosed_gardens",
      name: "Enclosed Garden",
      recordTypes: [R.venue, R.event],
      applicableTypes: "venue",
      description: "Contained, intimate spaces",
    },
  ],

  playgrounds_and_adventure_play: [
    {
      slug: "large_playgrounds",
      name: "Destination Playground",
      recordTypes: [R.venue, R.event],
      applicableTypes: "venue",
      description: "Big, well-equipped playgrounds",
    },
    {
      slug: "local_playgrounds",
      name: "Local park",
      recordTypes: [R.venue, R.event],
      applicableTypes: "venue",
      description: "Smaller, village parks",
    },
    {
      slug: "adventure_playgrounds",
      name: "Adventure Playground",
      recordTypes: [R.venue, R.event],
      applicableTypes: "venue",
      description: "More challenging, exploratory play",
    },
    {
      slug: "natural_play",
      name: "Natural Obstacle Course",
      recordTypes: [R.venue, R.event],
      applicableTypes: "venue",
      description: "Wood, ropes, nature-led design",
    },
    {
      slug: "skate_park",
      name: "Skate Park",
      recordTypes: [R.venue, R.event],
      applicableTypes: "venue",
      description:
        "Ramps, jumps, smoothed surface intended for skates",
    },
    {
      slug: "orienteering_course",
      name: "Orienteering Course",
      recordTypes: [R.venue, R.event],
      applicableTypes: "venue",
      description: "Height, obstacles, physical challenge",
    },
    {
      slug: "letterboxing_course",
      name: "Letterboxing Site",
      recordTypes: [R.venue, R.event],
      applicableTypes: "venue",
      description: "Fast-paced, physical play",
    },
  ],

  sporty_activities: [
    {
      slug: "leisure_centre",
      name: "Leisure Centre",
      recordTypes: [R.venue, R.club, R.event],
      applicableTypes: "venue, club, event",
    },
    {
      slug: "climbing_centre",
      name: "Climbing Centre",
      recordTypes: [R.venue, R.club, R.event],
      applicableTypes: "venue, club, event",
    },
    {
      slug: "multisports_activity_centre",
      name: "Multisports Centre",
      recordTypes: [R.venue, R.club, R.event],
      applicableTypes: "venue, club, event",
    },
    {
      slug: "sports_stadium",
      name: "Sport Stadium",
      recordTypes: [R.venue, R.club, R.event],
      applicableTypes: "venue, club, event",
    },
    {
      slug: "sports_arena",
      name: "Sport Arena",
      recordTypes: [R.venue, R.club, R.event],
      applicableTypes: "venue, club, event",
    },
    {
      slug: "swimming_pool",
      name: "Swimming Pool",
      recordTypes: [R.venue, R.club, R.event],
      applicableTypes: "venue, club, event",
    },
    {
      slug: "community_centre",
      name: "Community Centre",
      recordTypes: [R.venue, R.club, R.event],
      applicableTypes: "venue, club, event",
    },
    {
      slug: "range",
      name: "Range",
      recordTypes: [R.venue, R.club, R.event],
      applicableTypes: "venue, club, event",
    },
    {
      slug: "sports_track",
      name: "Sports Track",
      recordTypes: [R.venue, R.club, R.event],
      applicableTypes: "venue, club, event",
    },
    {
      slug: "indoor_courts",
      name: "Indoor Court",
      recordTypes: [R.venue, R.club, R.event],
      applicableTypes: "venue, club, event",
    },
    {
      slug: "outdoor_courts",
      name: "Outdoor Court",
      recordTypes: [R.venue, R.club, R.event],
      applicableTypes: "venue, club, event",
    },
    {
      slug: "specialist_sports_facility",
      name: "Specialist Facility",
      recordTypes: [R.venue, R.club, R.event],
      applicableTypes: "venue, club, event",
    },
    {
      slug: "outdoor_pitch",
      name: "Outdoor Pitch",
      recordTypes: [R.venue, R.club, R.event],
      applicableTypes: "venue, club, event",
    },
    {
      slug: "gym",
      name: "Gym",
      recordTypes: [R.venue, R.club, R.event],
      applicableTypes: "venue, club, event",
    },
  ],

  wheels_and_rideable_routes: [
    {
      slug: "quick_spin",
      name: "Quick spin",
      recordTypes: [R.route],
      applicableTypes: "route",
      description:
        "Easy win / quick reset energy; broad bike/scooter feel without specifying kit.",
    },
    {
      slug: "longer_ride",
      name: "Longer ride",
      recordTypes: [R.route],
      applicableTypes: "route",
      description:
        "A more committed outing without implying distance, difficulty, or route shape.",
    },
    {
      slug: "practise_route",
      name: "Practise Space",
      recordTypes: [R.route, R.venue, R.club, R.event],
      applicableTypes: "route, venue",
      description:
        "Learning, improving, settling nerves; learn-to-ride and skill progression.",
    },
    {
      slug: "skills_and_stunts",
      name: "Skills & Stunts Space",
      recordTypes: [R.route, R.venue, R.club, R.event],
      applicableTypes: "route, venue",
      description:
        "Pump tracks, ramps, jumps; high-energy, skill-testing feel.",
    },
  ],

  water_based_fun: [
    {
      slug: "paddle_spot",
      name: "Paddle Spot",
      recordTypes: [R.venue, R.club, R.event],
      applicableTypes: "Activity Venue, Route",
      description:
        "Paddling, shallow water, splashy play without naming water type.",
    },
    {
      slug: "water_play",
      name: "Water play",
      recordTypes: [R.venue, R.club, R.event],
      applicableTypes: "Activity Venue, Route",
      description:
        "Calm, low-risk, sensory water experiences (streams, edges, shallow areas).",
    },
    {
      slug: "river_beach",
      name: "River Beach",
      recordTypes: [R.venue, R.club, R.event],
      applicableTypes: "Activity Venue, Route",
      description: "Calm water, shade, inland feel",
    },
    {
      slug: "water_park",
      name: "Waterparks",
      recordTypes: [R.venue],
      applicableTypes: "Activity Venue",
      description:
        "Splash parks / fountains without facility lists.",
    },
    {
      slug: "water_rides",
      name: "On The Water",
      recordTypes: [R.venue, R.club, R.event],
      applicableTypes: "activity, venue, club",
    },
    {
      slug: "water_adventure",
      name: "Water Adventure",
      recordTypes: [R.venue, R.club, R.event],
      applicableTypes: "Activity Venue, Route",
      description:
        "Braver, exploratory water experiences without tipping into Beach or Sporty.",
    },
  ],

  creative_and_expressive_play: [
    {
      slug: "making_and_creating",
      name: "Creative Artwork",
      recordTypes: [R.venue, R.club, R.event],
      applicableTypes: "Activity Venue, Club, Event",
      description:
        "Hands-on creative output: art, craft, clay, textiles.",
    },
    {
      slug: "expressive_movement_and_music",
      name: "Music & Movement",
      recordTypes: [R.venue, R.club, R.event],
      applicableTypes: "Activity Venue, Club, Event",
      description:
        "Singing, dancing, rhythm, performance through the body; not fitness-led.",
    },
    {
      slug: "creative_expression",
      name: "Creative Expression",
      recordTypes: [R.venue, R.club, R.event],
      applicableTypes: "Activity Venue, Club, Event",
      description:
        "Creative writing, poetry, spoken verse, storytelling",
    },
    {
      slug: "performing_and_putting_on_a_show",
      name: "Performative Arts",
      recordTypes: [R.venue, R.club, R.event],
      applicableTypes: "Activity Venue, Club, Event",
      description:
        "Drama, theatre-style play, confidence-building expression.",
    },
    {
      slug: "film_photography",
      name: "Film or Media",
      recordTypes: [R.venue, R.club, R.event],
      applicableTypes: "Activity Venue, Club, Event",
      description:
        "Photography, film, creative documentation as meaning-making.",
    },
  ],

  imaginative_and_role_play: [
    {
      slug: "role_play_and_characters",
      name: "Character-Led Play",
      recordTypes: [R.venue, R.club, R.event],
      applicableTypes: "Activity Venue, Club, Event",
      description:
        "Dressing up through to character-led re-enactment.",
    },
    {
      slug: "immersive_worlds",
      name: "Immersive Worlds",
      recordTypes: [R.venue, R.event],
      applicableTypes: "Activity Venue, Event",
      description: "Depth and escapism without sounding provider-led.",
    },
    {
      slug: "scenario_and_world_play",
      name: "Scenario & World play",
      recordTypes: [R.venue, R.club],
      applicableTypes: "Activity Venue, Club",
      description:
        "Small-world play and complex scenario building or re-enactment.",
    },
    {
      slug: "narrative_led_experiences",
      name: "Narrative-led experiences",
      recordTypes: [R.venue, R.event],
      applicableTypes: "Activity Venue, Event",
      description: "Story-driven experiences without academic tone.",
    },
  ],

  sensory_or_calming_experiences: [
    {
      slug: "sensory_garden",
      name: "Sensory garden",
      recordTypes: [R.venue],
      applicableTypes: "Activity Venue",
      description:
        "Outdoor, designed-for-senses, calming by intent.",
    },
    {
      slug: "sensory_room_or_space",
      name: "Sensory Space",
      recordTypes: [R.venue],
      applicableTypes: "Activity Venue",
      description: "Dedicated indoor sensory rooms or calming spaces.",
    },
    {
      slug: "calming_designed_environment",
      name: "Soothing Environment",
      recordTypes: [R.venue, R.event],
      applicableTypes: "Activity Venue, Event",
      description:
        "Intentionally gentle environments or installations.",
    },
    {
      slug: "light_touch_sensory_experience",
      name: "Light-touch Sensory",
      recordTypes: [R.venue, R.event],
      applicableTypes: "Activity Venue, Event",
      description: "Sensory-focused but not intense or overwhelming.",
    },
  ],

  hands_on_learning: [
    {
      slug: "experiments",
      name: "Experiments",
      recordTypes: [R.venue, R.event],
      applicableTypes: "venue, event",
      description: "Science-style exploration, trial & error",
    },
    {
      slug: "discovery_challenges",
      name: "Discovery-Based Challenges",
      recordTypes: [R.venue, R.event],
      applicableTypes: "venue, event",
    },
    {
      slug: "learning_through_play",
      name: "Learning Through Play",
      recordTypes: [R.venue, R.event],
      applicableTypes: "venue, event",
      description: "Play-led learning environments",
    },
    {
      slug: "interactive_exhibits",
      name: "Interactive Exhibits",
      recordTypes: [R.venue, R.event],
      applicableTypes: "venue, event",
      description: "Touch, build, manipulate",
    },
    {
      slug: "problem_solving",
      name: "Problem-Solving",
      recordTypes: [R.venue, R.event],
      applicableTypes: "venue, event",
      description: "Puzzles, logic, engineering-style tasks",
    },
    {
      slug: "construction_activity",
      name: "Construction Activities",
      recordTypes: [R.venue, R.event],
      applicableTypes: "venue, event",
      description: "Constructing, assembling, creating",
    },
  ],

  interactive_museums_and_discovery: [
    {
      slug: "science_and_discovery",
      name: "Science & Discovery",
      recordTypes: [R.venue, R.event],
      applicableTypes: "venue",
      description: "Science centres, discovery museums",
    },
    {
      slug: "technology_and_innovation",
      name: "Technology & Innovation",
      recordTypes: [R.venue, R.event],
      applicableTypes: "venue",
      description: "Tech, engineering, innovation spaces",
    },
    {
      slug: "history_made_interactive",
      name: "History & Pastimes",
      recordTypes: [R.venue, R.event],
      applicableTypes: "venue",
      description: "History presented interactively",
    },
    {
      slug: "world_and_cultures",
      name: "World & Cultures",
      recordTypes: [R.venue, R.event],
      applicableTypes: "venue",
      description: "Geography, people, global cultures",
    },
    {
      slug: "children_focused_discovery",
      name: "Child-Focused Discovery",
      recordTypes: [R.venue, R.event],
      applicableTypes: "venue",
      description: "Designed specifically for children",
    },
  ],

  animal_encounters: [
    {
      slug: "farm_and_smallholding",
      name: "Farm or Smallholding",
      recordTypes: [R.venue, R.event],
      applicableTypes: "venue, event",
      description: "Petting farms, open farms, smallholdings",
    },
    {
      slug: "wildlife_reserve",
      name: "Wildlife Reserve",
      recordTypes: [R.venue],
      applicableTypes: "venue",
    },
    {
      slug: "animal_parks",
      name: "Animal Parks & Zoos",
      recordTypes: [R.venue],
      applicableTypes: "venue",
      description: "Zoos, safari parks, wildlife parks",
    },
    {
      slug: "conservation_project",
      name: "Conservation Project",
      recordTypes: [R.venue],
      applicableTypes: "venue",
      isActive: true,
    },
    {
      slug: "animal_sanctuary",
      name: "Animal Sanctuary",
      recordTypes: [R.venue, R.club, R.event],
      applicableTypes: "venue, event, club",
    },
    {
      slug: "sealife_aquarium",
      name: "Marine Aquarium",
      recordTypes: [R.venue, R.event],
      applicableTypes: "venue, event",
      description: "Aquatic animal centres",
    },
    {
      slug: "reptiles_and_exotics",
      name: "Reptiles & Exotics",
      recordTypes: [R.venue],
      applicableTypes: "venue",
      description: "Reptile centres, specialist collections",
    },
    {
      slug: "birds_of_prey",
      name: "Bird of Prey Centre",
      recordTypes: [R.venue, R.event],
      applicableTypes: "venue, event",
    },
    {
      slug: "stables_yard",
      name: "Stables or Yard",
      recordTypes: [R.venue, R.club],
      applicableTypes: "venue, club, experience",
      description: "Riding, grooming, pony encounters",
    },
  ],

  historical_and_cultural_exploration: [
    {
      slug: "ancient_sites",
      name: "Ancient Site",
      recordTypes: [R.venue],
      applicableTypes: "venue, route",
      description: "Castles, fortresses, ruins",
    },
    {
      slug: "historic_houses",
      name: "Historic Estate",
      recordTypes: [R.venue, R.event],
      applicableTypes: "venue",
      description: "Manor houses, estates, heritage homes",
    },
    {
      slug: "living_history",
      name: "Living History",
      recordTypes: [R.venue, R.event],
      applicableTypes: "venue",
      description: "Re-enactment, costumed history",
    },
    {
      slug: "open_museum",
      name: "Open-Air Museum",
      recordTypes: [R.venue, R.event],
      applicableTypes: "venue",
    },
    {
      slug: "industrial_history",
      name: "Industrial & Working History",
      recordTypes: [R.venue, R.event],
      applicableTypes: "venue",
      description: "Mills, railways, mines, docks",
    },
    {
      slug: "archaeological_sites",
      name: "Archaeological",
      recordTypes: [R.venue, R.event],
      applicableTypes: "venue",
      description: "Fossil spots, archaeological sites of interest",
    },
    {
      slug: "cultural_heritage",
      name: "Cultural Heritage Site",
      recordTypes: [R.venue, R.event],
      applicableTypes: "venue",
      description: "Cultural exhibitions, heritage centres",
    },
    {
      slug: "historic_religious",
      name: "Historic Religious Building",
      recordTypes: [R.venue, R.event],
      applicableTypes: "venue",
      description: "Cathedrals, abbeys, historic churches",
    },
  ],

  soft_play_and_indoor_energy: [
    {
      slug: "large_soft_play",
      name: "Soft Play Centre",
      recordTypes: [R.venue, R.event],
      applicableTypes: "venue",
      description: "Multi-level, slides, big structures",
    },
    {
      slug: "toddler_soft_play",
      name: "Toddler Play Space",
      recordTypes: [R.venue, R.event],
      applicableTypes: "venue",
      description: "Designed for under 5s",
    },
    {
      slug: "indoor_climbing",
      name: "Indoor Climbing",
      recordTypes: [R.venue, R.event],
      applicableTypes: "venue",
      description: "Climbing walls, obstacle-style energy",
    },
    {
      slug: "indoor_course",
      name: "Inside Course",
      recordTypes: [R.venue, R.event],
      applicableTypes: "venue",
      description: "Assault course, ninja course, obstacles",
    },
    {
      slug: "trampoline_park",
      name: "Trampoline Park",
      recordTypes: [R.venue, R.event],
      applicableTypes: "venue",
      description: "Trampolines, bounce parks",
    },
    {
      slug: "indoor_multi_activity",
      name: "Multi-Activity Centre",
      recordTypes: [R.venue, R.event],
      applicableTypes: "venue",
      description: "Mixed zones: soft play + trampolines etc",
    },
  ],

  indoor_entertainment: [
    {
      slug: "cinema",
      name: "Cinema",
      recordTypes: [R.event, R.club],
      applicableTypes: "event, club",
    },
    {
      slug: "theatre_panto",
      name: "Stage-Show",
      recordTypes: [R.event, R.club],
      applicableTypes: "event, club",
    },
    {
      slug: "live_events",
      name: "Live Events",
      recordTypes: [R.event, R.club],
      applicableTypes: "event, club",
    },
    {
      slug: "gaming",
      name: "Gaming & VR",
      recordTypes: [R.venue, R.event, R.club],
      applicableTypes: "venue, event, club",
    },
    {
      slug: "comedy_club",
      name: "Improvised Performance",
      recordTypes: [R.event, R.club],
      applicableTypes: "event, club",
    },
    {
      slug: "bowling_alley",
      name: "Bowling",
      recordTypes: [R.venue, R.event, R.club],
      applicableTypes: "venue, event, club",
    },
  ],

  transport_and_engineering: [
    {
      slug: "trains_and_rail",
      name: "Trains & Railways",
      recordTypes: [R.venue, R.club, R.event],
      applicableTypes: "venue, route",
      description: "Steam, heritage, miniature railways",
    },
    {
      slug: "boat_trips",
      name: "Boat Trips & Ferries",
      recordTypes: [R.venue, R.club, R.event],
      applicableTypes: "route, event",
      description: "Ferries, sightseeing boat trips",
    },
    {
      slug: "harbours_and_marinas",
      name: "Harbours & Marinas",
      recordTypes: [R.venue, R.club, R.event],
      applicableTypes: "venue",
      description: "Watching boats, ports, docks",
    },
    {
      slug: "aviation_experiences",
      name: "Aircraft & Aviation",
      recordTypes: [R.venue, R.club, R.event],
      applicableTypes: "venue",
      description: "Museums, viewing areas, airfields",
    },
    {
      slug: "transport_museums",
      name: "Transport Museum",
      recordTypes: [R.venue, R.club, R.event],
      applicableTypes: "venue",
      description: "Cars, buses, mixed vehicle collections",
    },
    {
      slug: "working_transport_hubs",
      name: "Working Transport Hubs",
      recordTypes: [R.venue, R.club, R.event],
      applicableTypes: "venue",
      description: "Stations, depots, logistics hubs",
    },
  ],

  a_big_day_out: [
    {
      slug: "themepark",
      name: "Themepark",
      recordTypes: [R.venue],
      applicableTypes: "venue",
      description: "Ride-based parks",
    },
    {
      slug: "amusement_park",
      name: "Amusement Park",
      recordTypes: [R.venue],
      applicableTypes: "venue",
      description: "Arcades",
    },
    {
      slug: "major_animal_attractions",
      name: "Major Animal Attractions",
      recordTypes: [R.venue],
      applicableTypes: "venue",
      description: "Zoos, safari parks",
    },
    {
      slug: "large_scale_outdoor",
      name: "Large-Scale Outdoor Attractions",
      recordTypes: [R.venue],
      applicableTypes: "venue",
      description: "Estates, expansive outdoor sites",
    },
    {
      slug: "major_indoor",
      name: "Major Indoor Attractions",
      recordTypes: [R.venue],
      applicableTypes: "venue",
      description: "Large indoor destinations",
    },
    {
      slug: "seasonal_and_themed",
      name: "Seasonal & Themed Events",
      recordTypes: [R.venue, R.event],
      applicableTypes: "venue, event",
      description: "Christmas trails, festivals, themed days",
    },
  ],

  a_relaxed_coffee_stop: [
    {
      slug: "family_friendly_cafes",
      name: "Family-Friendly Cafés",
      recordTypes: [R.venue, R.event],
      applicableTypes: "venue, event",
      description: "Welcoming, space for kids",
    },
    {
      slug: "cafe_with_play",
      name: "Quiet Cafés",
      recordTypes: [R.venue],
      applicableTypes: "venue",
      description: "Toys, books, colouring",
    },
    {
      slug: "cafe_with_outdoor_space",
      name: "Cafés with Outdoor Space",
      recordTypes: [R.venue],
      applicableTypes: "venue",
      description: "Gardens, courtyards, terraces",
    },
    {
      slug: "coffee_cabin",
      name: "Coffee Cabin / Truck",
      recordTypes: [R.venue],
      applicableTypes: "venue",
      description:
        "Small mobile coffee stations with nearby seating / views",
    },
    {
      slug: "pit_stop_cafes",
      name: "Easy Pit-Stops",
      recordTypes: [R.venue],
      applicableTypes: "venue",
      description: "On routes, parks, attractions",
    },
  ],

  family_dining: [
    {
      slug: "casual_family_restaurants",
      name: "Family Eateries",
      recordTypes: [R.venue],
      applicableTypes: "venue",
      description: "Relaxed, unfussy, welcoming",
    },
    {
      slug: "dining_with_space",
      name: "Outdoor Family Dining",
      recordTypes: [R.venue],
      applicableTypes: "venue",
      description: "Gardens, play corners, outdoor areas",
    },
    {
      slug: "destination_dining",
      name: "Destination Family Dining",
      recordTypes: [R.venue],
      applicableTypes: "venue",
      description: "Food as part of a wider outing",
    },
    {
      slug: "food_festival",
      name: "Food Festivals",
      recordTypes: [R.venue],
      applicableTypes: "venue",
    },
  ],
};

export async function seedOpportunityThemes(prisma: PrismaClient) {
  // Import rows FK to theme/variant with ON DELETE RESTRICT — clear them before
  // wiping the catalog so deleteMany on themes does not fail (Postgres 23001).
  await prisma.opportunityVenueV2.deleteMany();
  await prisma.opportunityVenuesV2.deleteMany();
  await prisma.opportunityClubV2.deleteMany();
  await prisma.opportunityRouteV2.deleteMany();

  await prisma.opportunityTheme.deleteMany();

  const themeRows = themesToCreate();
  await prisma.opportunityTheme.createMany({ data: themeRows });

  const themes = await prisma.opportunityTheme.findMany({
    select: { id: true, recordType: true, slug: true },
  });
  const themeIdByKey = new Map<string, string>();
  for (const t of themes) {
    themeIdByKey.set(`${t.recordType}:${t.slug}`, t.id);
  }

  const variantRows: {
    themeId: string;
    slug: string;
    name: string;
    applicableTypes: string | null;
    description: string | null;
    isActive: boolean;
    sortOrder: number;
  }[] = [];

  const orderByThemeId = new Map<string, number>();

  for (const themeSlug of Object.keys(VARIANTS_BY_THEME) as ThemeSlug[]) {
    const variants = VARIANTS_BY_THEME[themeSlug];
    for (const v of variants) {
      for (const recordType of v.recordTypes) {
        const themeId = themeIdByKey.get(`${recordType}:${themeSlug}`);
        if (!themeId) {
          console.warn(
            `Skipping variant ${v.slug}: no theme ${recordType}:${themeSlug}`,
          );
          continue;
        }
        const sortOrder = orderByThemeId.get(themeId) ?? 0;
        orderByThemeId.set(themeId, sortOrder + 1);
        variantRows.push({
          themeId,
          slug: v.slug,
          name: v.name,
          applicableTypes: v.applicableTypes ?? null,
          description: v.description ?? null,
          isActive: v.isActive ?? true,
          sortOrder,
        });
      }
    }
  }

  await prisma.opportunityThemeVariant.createMany({ data: variantRows });

  console.log(
    `Seeded ${themeRows.length} opportunity themes and ${variantRows.length} variants.`,
  );
}
