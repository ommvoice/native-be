import type { PrismaClient } from "@prisma/client";
import { skillBoundsFromAgeGuidance } from "../api/modules/skills/skillAgeGuidance.js";

type SkillRow = {
  slug: string;
  label: string;
  ageGuidance: string;
  description: string;
};

type InterestSkillSeedBundle = {
  categorySlug: string;
  /** Root interest subcategory (`parentId` null) */
  rootSubcategorySlug: string;
  skills: SkillRow[];
};

/**
 * Interest-based skills on root subcategories. Ages map to Skill.minAge / maxAge via `skillBoundsFromAgeGuidance`.
 * `water_fun` exists under both Nature & Exploration and Movement & Energy — distinct skill slugs per category (Skill.slug is global).
 * `indoor_entertainment` / “A Big Day Out” repeat across categories — `categorySlug` picks the row from `seed_interests.ts`.
 */
const INTEREST_BASED_SKILL_SEEDS: InterestSkillSeedBundle[] = [
  {
    categorySlug: "nature_exploration",
    rootSubcategorySlug: "coastal_adventures",
    skills: [
      {
        slug: "coastal_adventures_sailing",
        label: "Sailing",
        ageGuidance: "Age 6 and over",
        description:
          "On-the-water sailing skills and experiences. Typically suitable from age 6 and over; providers vary.",
      },
      {
        slug: "coastal_adventures_coasteering",
        label: "Coasteering",
        ageGuidance: "Age 8 and over",
        description:
          "Coastal traversing, jumps, and swims along the shoreline. Typically suitable from age 8 and over; providers vary.",
      },
    ],
  },
  {
    categorySlug: "nature_exploration",
    rootSubcategorySlug: "nature_wildlife",
    skills: [
      {
        slug: "nature_wildlife_orienteering_navigation",
        label: "Orienteering or Navigation",
        ageGuidance: "Age 8 and over",
        description:
          "Map, compass, and route-finding skills outdoors. Typically suitable from age 8 and over; providers vary.",
      },
    ],
  },
  {
    categorySlug: "nature_exploration",
    rootSubcategorySlug: "water_fun",
    skills: [
      {
        slug: "nature_water_fun_paddleboarding",
        label: "Paddleboarding",
        ageGuidance: "Age 8 and over",
        description:
          "Balance and paddle skills on a board. Typically suitable from age 8 and over; providers vary.",
      },
      {
        slug: "nature_water_fun_kayaking",
        label: "Kayaking",
        ageGuidance: "Age 8 and over",
        description:
          "Paddling and boat control in a kayak. Typically suitable from age 8 and over; providers vary.",
      },
      {
        slug: "nature_water_fun_surfing",
        label: "Surfing",
        ageGuidance: "Age 6 and over",
        description:
          "Wave riding and board skills in the surf. Typically suitable from age 6 and over; providers vary.",
      },
    ],
  },
  {
    categorySlug: "movement_energy",
    rootSubcategorySlug: "water_fun",
    skills: [
      {
        slug: "movement_water_fun_paddleboarding",
        label: "Paddleboarding",
        ageGuidance: "Age 8 and over",
        description:
          "Balance and paddle skills on a board. Typically suitable from age 8 and over; providers vary.",
      },
      {
        slug: "movement_water_fun_kayaking",
        label: "Kayaking",
        ageGuidance: "Age 8 and over",
        description:
          "Paddling and boat control in a kayak. Typically suitable from age 8 and over; providers vary.",
      },
      {
        slug: "movement_water_fun_surfing",
        label: "Surfing",
        ageGuidance: "Age 6 and over",
        description:
          "Wave riding and board skills in the surf. Typically suitable from age 6 and over; providers vary.",
      },
    ],
  },
  {
    categorySlug: "creativity_imagination",
    rootSubcategorySlug: "creative_play",
    skills: [
      {
        slug: "creative_play_dance",
        label: "Dance",
        ageGuidance: "Age 5 and over",
        description:
          "Movement, rhythm, and performance basics. Typically suitable from age 5 and over; providers vary.",
      },
      {
        slug: "creative_play_music",
        label: "Music",
        ageGuidance: "Age 8 and over",
        description:
          "Listening, instruments, and musical skills. Typically suitable from age 8 and over; providers vary.",
      },
      {
        slug: "creative_play_creative_writing",
        label: "Creative Writing",
        ageGuidance: "Age 10 and over",
        description:
          "Stories, poetry, and expressive writing skills. Typically suitable from age 10 and over; providers vary.",
      },
    ],
  },
  {
    categorySlug: "creativity_imagination",
    rootSubcategorySlug: "imaginative_play",
    skills: [
      {
        slug: "imaginative_play_drama_acting",
        label: "Drama / Acting",
        ageGuidance: "Age 5 and over",
        description:
          "Character, voice, and stage confidence through drama. Typically suitable from age 5 and over; providers vary.",
      },
    ],
  },
  {
    categorySlug: "movement_energy",
    rootSubcategorySlug: "active_play_climbing",
    skills: [
      {
        slug: "active_play_climbing_climbing",
        label: "Climbing",
        ageGuidance: "Age 6 and over",
        description:
          "Roped walls, bouldering, and climbing movement skills. Typically suitable from age 6 and over; providers vary.",
      },
    ],
  },
  {
    categorySlug: "movement_energy",
    rootSubcategorySlug: "sporty_activities",
    skills: [
      {
        slug: "sporty_activities_football",
        label: "Football",
        ageGuidance: "Age 6 and over",
        description:
          "Ball control, teamwork, and match play. Typically suitable from age 6 and over; providers vary.",
      },
      {
        slug: "sporty_activities_tennis",
        label: "Tennis",
        ageGuidance: "Age 5 and over",
        description:
          "Racket skills, court movement, and rally play. Typically suitable from age 5 and over; providers vary.",
      },
      {
        slug: "sporty_activities_athletics",
        label: "Athletics",
        ageGuidance: "Age 7 and over",
        description:
          "Running, jumping, and throwing fundamentals. Typically suitable from age 7 and over; providers vary.",
      },
      {
        slug: "sporty_activities_gymnastics",
        label: "Gymnastics",
        ageGuidance: "Age 7 and over",
        description:
          "Flexibility, strength, and apparatus basics. Typically suitable from age 7 and over; providers vary.",
      },
      {
        slug: "sporty_activities_martial_arts",
        label: "Martial Arts",
        ageGuidance: "Age 6 and over",
        description:
          "Discipline, movement patterns, and safe practice. Typically suitable from age 6 and over; providers vary.",
      },
    ],
  },
  {
    categorySlug: "movement_energy",
    rootSubcategorySlug: "wheels_routes",
    skills: [
      {
        slug: "wheels_routes_skateboarding",
        label: "Skateboarding",
        ageGuidance: "Age 7 and over",
        description:
          "Board control, balance, and park or street basics. Typically suitable from age 7 and over; providers vary.",
      },
      {
        slug: "wheels_routes_rollerblades_skates",
        label: "Rollerblades / skates",
        ageGuidance: "Age 6 and over",
        description:
          "Inline or quad skating skills and safe stopping. Typically suitable from age 6 and over; providers vary.",
      },
      {
        slug: "wheels_routes_motorcross",
        label: "Motorcross",
        ageGuidance: "Age 6 and over",
        description:
          "Off-road bike control and track awareness. Typically suitable from age 6 and over; providers vary.",
      },
    ],
  },
  {
    categorySlug: "learning_curiosity",
    rootSubcategorySlug: "hands_on_learning",
    skills: [
      {
        slug: "hands_on_learning_coding",
        label: "Coding",
        ageGuidance: "Age 8 and over",
        description:
          "Logic, problem-solving, and programming basics. Typically suitable from age 8 and over; providers vary.",
      },
    ],
  },
  {
    categorySlug: "learning_curiosity",
    rootSubcategorySlug: "animal_encounters",
    skills: [
      {
        slug: "learning_animal_encounters_horse_riding",
        label: "Horse Riding",
        ageGuidance: "Age 6 and over",
        description:
          "Riding position, control, and care around horses. Typically suitable from age 6 and over; providers vary.",
      },
      {
        slug: "learning_animal_encounters_animal_husbandry",
        label: "Animal Husbandry",
        ageGuidance: "Age 8 and over",
        description:
          "Feeding, handling, and welfare skills with animals. Typically suitable from age 8 and over; providers vary.",
      },
    ],
  },
  {
    categorySlug: "learning_curiosity",
    rootSubcategorySlug: "vehicles_transport",
    skills: [
      {
        slug: "vehicles_transport_robotics",
        label: "Robotics",
        ageGuidance: "Age 8 and over",
        description:
          "Building, coding, and controlling robots. Typically suitable from age 8 and over; providers vary.",
      },
      {
        slug: "vehicles_transport_construction",
        label: "Construction",
        ageGuidance: "Age 8 and over",
        description:
          "Structures, tools, and safe making skills. Typically suitable from age 8 and over; providers vary.",
      },
    ],
  },
  {
    categorySlug: "slowing_down",
    rootSubcategorySlug: "sensory_soothing",
    skills: [
      {
        slug: "sensory_soothing_yoga",
        label: "Yoga",
        ageGuidance: "Age 10 and over",
        description:
          "Breath, balance, and mindful movement. Typically suitable from age 10 and over; providers vary.",
      },
    ],
  },
  {
    categorySlug: "special_memorable",
    rootSubcategorySlug: "a_big_day_out",
    skills: [
      {
        slug: "special_memorable_big_day_out_escape_rooms",
        label: "Escape rooms",
        ageGuidance: "Age 8 and over",
        description:
          "Team puzzles, clues, and timed challenges. Typically suitable from age 8 and over; providers vary.",
      },
    ],
  },
  {
    categorySlug: "special_memorable",
    rootSubcategorySlug: "indoor_entertainment",
    skills: [
      {
        slug: "special_memorable_indoor_entertainment_go_karting",
        label: "Go-Karting",
        ageGuidance: "Age 8 and over",
        description:
          "Track driving basics and safety. Typically suitable from age 8 and over; providers vary.",
      },
    ],
  },
];

async function findRootInterestSubCategory(
  prisma: PrismaClient,
  categorySlug: string,
  rootSubcategorySlug: string,
) {
  const category = await prisma.interestCategory.findUnique({
    where: { slug: categorySlug },
  });
  if (!category) {
    throw new Error(`Interest category not found: ${categorySlug}`);
  }
  const sub = await prisma.interestSubCategory.findFirst({
    where: {
      categoryId: category.id,
      slug: rootSubcategorySlug,
      parentId: null,
    },
  });
  if (!sub) {
    throw new Error(
      `Root interest subcategory not found: ${categorySlug} / ${rootSubcategorySlug}`,
    );
  }
  return sub;
}

export async function seedInterestBasedSkills(prisma: PrismaClient): Promise<void> {
  for (const def of INTEREST_BASED_SKILL_SEEDS) {
    const sub = await findRootInterestSubCategory(
      prisma,
      def.categorySlug,
      def.rootSubcategorySlug,
    );

    for (const skill of def.skills) {
      const bounds = skillBoundsFromAgeGuidance(skill.ageGuidance);
      await prisma.skill.upsert({
        where: { slug: skill.slug },
        update: {
          type: "INTEREST_BASED",
          subCategoryId: sub.id,
          label: skill.label,
          description: skill.description,
          minAge: bounds.minAge,
          maxAge: bounds.maxAge,
        },
        create: {
          slug: skill.slug,
          type: "INTEREST_BASED",
          subCategoryId: sub.id,
          label: skill.label,
          description: skill.description,
          minAge: bounds.minAge,
          maxAge: bounds.maxAge,
        },
      });
    }
  }
}

/** @deprecated Use `seedInterestBasedSkills` */
export const seedCoastalAdventureSkills = seedInterestBasedSkills;
