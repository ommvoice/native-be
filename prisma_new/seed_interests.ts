import "dotenv/config";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

const interestCategories: { slug: string; name: string }[] = [
  { slug: "nature_exploration", name: "Nature & Exploration" },
  { slug: "movement_energy", name: "Movement & Energy" },
  { slug: "creativity_imagination", name: "Creativity & Imagination" },
  { slug: "learning_curiosity", name: "Learning & Curiosity" },
  { slug: "slowing_down", name: "Slowing Down" },
  { slug: "together_time", name: "Family Resets" },
  { slug: "special_memorable", name: "Special & Memorable Days Out" },
];

/**
 * Parent category slug → subcategory slug + display name (slug may repeat across categories).
 * `parentSlug`: immediate parent subcategory slug under the same category (root-level rows omit it).
 */
const interestSubCategories: {
  categorySlug: string;
  slug: string;
  name: string;
  suitableForAge?: string | null;
  parentSlug?: string;
}[] = [
  // Nature & Exploration — themes (root subcategories)
  {
    categorySlug: "nature_exploration",
    slug: "scenic_walks",
    name: "Scenic Walks & Wanders",
  },
  {
    categorySlug: "nature_exploration",
    slug: "green_spaces",
    name: "Green Spaces to Run Around",
  },
  {
    categorySlug: "nature_exploration",
    slug: "nature_wildlife",
    name: "Nature & Wildlife Exploration",
    suitableForAge: "8+",
  },
  {
    categorySlug: "nature_exploration",
    slug: "coastal_adventures",
    name: "Coastal Adventures",
  },
  {
    categorySlug: "nature_exploration",
    slug: "gardens_outdoor",
    name: "Gardens & Curated Outdoor Spaces",
  },
  {
    categorySlug: "nature_exploration",
    slug: "water_fun",
    name: "Water-Based Fun",
  },
  // Nature & Exploration — under Coastal Adventures
  {
    categorySlug: "nature_exploration",
    parentSlug: "coastal_adventures",
    slug: "sailing",
    name: "Sailing",
    suitableForAge: "6+",
  },
  {
    categorySlug: "nature_exploration",
    parentSlug: "coastal_adventures",
    slug: "coasteering",
    name: "Coasteering",
    suitableForAge: "8+",
  },
  // Nature & Exploration — under Water-Based Fun
  {
    categorySlug: "nature_exploration",
    parentSlug: "water_fun",
    slug: "paddleboarding",
    name: "Paddleboarding",
    suitableForAge: "8+",
  },
  {
    categorySlug: "nature_exploration",
    parentSlug: "water_fun",
    slug: "kayaking",
    name: "Kayaking",
    suitableForAge: "8+",
  },
  {
    categorySlug: "nature_exploration",
    parentSlug: "water_fun",
    slug: "surfing",
    name: "Surfing",
    suitableForAge: "6+",
  },
  // Movement & Energy — roots
  {
    categorySlug: "movement_energy",
    slug: "active_play_climbing",
    name: "Playgrounds & Adventure Play",
  },
  {
    categorySlug: "movement_energy",
    slug: "sporty_activities",
    name: "Sporty Activities",
  },
  {
    categorySlug: "movement_energy",
    slug: "wheels_routes",
    name: "Wheels & Rideable Routes",
  },
  {
    categorySlug: "movement_energy",
    slug: "soft_play",
    name: "Soft Play & Indoor Energy",
  },
  {
    categorySlug: "movement_energy",
    slug: "water_fun",
    name: "Water-Based Fun",
  },
  {
    categorySlug: "movement_energy",
    slug: "hands_on_learning",
    name: "Hands-On Learning",
  },
  // Movement & Energy — under Playgrounds & Adventure Play
  {
    categorySlug: "movement_energy",
    parentSlug: "active_play_climbing",
    slug: "climbing",
    name: "Climbing",
    suitableForAge: "6+",
  },
  // Movement & Energy — under Sporty Activities
  {
    categorySlug: "movement_energy",
    parentSlug: "sporty_activities",
    slug: "football",
    name: "Football",
    suitableForAge: "6+",
  },
  {
    categorySlug: "movement_energy",
    parentSlug: "sporty_activities",
    slug: "tennis",
    name: "Tennis",
    suitableForAge: "5+",
  },
  {
    categorySlug: "movement_energy",
    parentSlug: "sporty_activities",
    slug: "athletics",
    name: "Athletics",
    suitableForAge: "7+",
  },
  {
    categorySlug: "movement_energy",
    parentSlug: "sporty_activities",
    slug: "gymnastics",
    name: "Gymnastics",
    suitableForAge: "7+",
  },
  {
    categorySlug: "movement_energy",
    parentSlug: "sporty_activities",
    slug: "martial_arts",
    name: "Martial Arts",
    suitableForAge: "6+",
  },
  // Movement & Energy — under Wheels & Rideable Routes
  {
    categorySlug: "movement_energy",
    parentSlug: "wheels_routes",
    slug: "skateboarding",
    name: "Skateboarding",
    suitableForAge: "7+",
  },
  {
    categorySlug: "movement_energy",
    parentSlug: "wheels_routes",
    slug: "rollerblades_skates",
    name: "Rollerblades / skates",
    suitableForAge: "6+",
  },
  {
    categorySlug: "movement_energy",
    parentSlug: "wheels_routes",
    slug: "motorcross",
    name: "Motorcross",
    suitableForAge: "6+",
  },
  // Movement & Energy — under Water-Based Fun (same as Nature & Exploration water_fun)
  {
    categorySlug: "movement_energy",
    parentSlug: "water_fun",
    slug: "paddleboarding",
    name: "Paddleboarding",
    suitableForAge: "8+",
  },
  {
    categorySlug: "movement_energy",
    parentSlug: "water_fun",
    slug: "kayaking",
    name: "Kayaking",
    suitableForAge: "8+",
  },
  {
    categorySlug: "movement_energy",
    parentSlug: "water_fun",
    slug: "surfing",
    name: "Surfing",
    suitableForAge: "6+",
  },
  // Creativity & Imagination — roots
  {
    categorySlug: "creativity_imagination",
    slug: "creative_play",
    name: "Creative & Expressive Play",
  },
  {
    categorySlug: "creativity_imagination",
    slug: "imaginative_play",
    name: "Imaginative & Role Play",
  },
  {
    categorySlug: "creativity_imagination",
    slug: "interactive_museums",
    name: "Interactive Museums & Discovery",
  },
  {
    categorySlug: "creativity_imagination",
    slug: "indoor_entertainment",
    name: "Indoor Entertainment",
  },
  {
    categorySlug: "creativity_imagination",
    slug: "historical_cultural",
    name: "Historical & Cultural Exploration",
  },
  // Creativity & Imagination — under Creative & Expressive Play
  {
    categorySlug: "creativity_imagination",
    parentSlug: "creative_play",
    slug: "dance",
    name: "Dance",
    suitableForAge: "5+",
  },
  {
    categorySlug: "creativity_imagination",
    parentSlug: "creative_play",
    slug: "music",
    name: "Music",
    suitableForAge: "8+",
  },
  {
    categorySlug: "creativity_imagination",
    parentSlug: "creative_play",
    slug: "creative_writing",
    name: "Creative Writing",
    suitableForAge: "10+",
  },
  // Creativity & Imagination — under Imaginative & Role Play
  {
    categorySlug: "creativity_imagination",
    parentSlug: "imaginative_play",
    slug: "drama_acting",
    name: "Drama / Acting",
    suitableForAge: "5+",
  },
  // Learning & Curiosity — roots
  {
    categorySlug: "learning_curiosity",
    slug: "hands_on_learning",
    name: "Hands-On Learning",
  },
  {
    categorySlug: "learning_curiosity",
    slug: "interactive_museums",
    name: "Interactive Museums & Discovery",
  },
  {
    categorySlug: "learning_curiosity",
    slug: "historical_cultural",
    name: "Historical & Cultural Exploration",
  },
  {
    categorySlug: "learning_curiosity",
    slug: "animal_encounters",
    name: "Animal Encounters",
  },
  {
    categorySlug: "learning_curiosity",
    slug: "vehicles_transport",
    name: "Transport & Engineering",
  },
  // Learning & Curiosity — under Hands-On Learning
  {
    categorySlug: "learning_curiosity",
    parentSlug: "hands_on_learning",
    slug: "coding",
    name: "Coding",
    suitableForAge: "8+",
  },
  // Learning & Curiosity — under Animal Encounters
  {
    categorySlug: "learning_curiosity",
    parentSlug: "animal_encounters",
    slug: "horse_riding",
    name: "Horse Riding",
    suitableForAge: "6+",
  },
  {
    categorySlug: "learning_curiosity",
    parentSlug: "animal_encounters",
    slug: "animal_husbandry",
    name: "Animal Husbandry",
    suitableForAge: "8+",
  },
  // Learning & Curiosity — under Transport & Engineering
  {
    categorySlug: "learning_curiosity",
    parentSlug: "vehicles_transport",
    slug: "robotics",
    name: "Robotics",
    suitableForAge: "8+",
  },
  {
    categorySlug: "learning_curiosity",
    parentSlug: "vehicles_transport",
    slug: "construction",
    name: "Construction",
    suitableForAge: "8+",
  },
  // Slowing Down — roots
  {
    categorySlug: "slowing_down",
    slug: "sensory_soothing",
    name: "Sensory or Calming Experiences",
  },
  {
    categorySlug: "slowing_down",
    slug: "relaxed_cafe",
    name: "A Relaxed Coffee Stop",
  },
  // Slowing Down — under Sensory or Calming Experiences
  {
    categorySlug: "slowing_down",
    parentSlug: "sensory_soothing",
    slug: "yoga",
    name: "Yoga",
    suitableForAge: "10+",
  },
  // Family Resets — roots
  {
    categorySlug: "together_time",
    slug: "family_dining",
    name: "Family Dining",
  },
  {
    categorySlug: "together_time",
    slug: "big_day_out",
    name: "A Big Day Out",
  },
  {
    categorySlug: "together_time",
    slug: "indoor_entertainment",
    name: "Indoor Entertainment",
  },
  {
    categorySlug: "together_time",
    slug: "relaxed_cafe",
    name: "A Relaxed Coffee Stop",
  },
  // Special & Memorable Days Out — roots
  {
    categorySlug: "special_memorable",
    slug: "a_big_day_out",
    name: "A Big Day Out",
  },
  {
    categorySlug: "special_memorable",
    slug: "indoor_entertainment",
    name: "Indoor Entertainment",
  },
  // Special & Memorable Days Out — under A Big Day Out
  {
    categorySlug: "special_memorable",
    parentSlug: "a_big_day_out",
    slug: "escape_rooms",
    name: "Escape rooms",
    suitableForAge: "8+",
  },
  // Special & Memorable Days Out — under Indoor Entertainment
  {
    categorySlug: "special_memorable",
    parentSlug: "indoor_entertainment",
    slug: "go_karting",
    name: "Go-Karting",
    suitableForAge: "8+",
  },
];

export async function seedInterestCategories(prisma: PrismaClient): Promise<void> {
  for (const row of interestCategories) {
    await prisma.interestCategory.upsert({
      where: { slug: row.slug },
      update: { name: row.name },
      create: { slug: row.slug, name: row.name },
    });
  }
}

function rootIdKey(categorySlug: string, slug: string): string {
  return `${categorySlug}\0${slug}`;
}

export async function seedInterestSubCategories(prisma: PrismaClient): Promise<void> {
  const categoryBySlug = new Map(
    (await prisma.interestCategory.findMany()).map((c) => [c.slug, c] as const),
  );

  const rootIdByKey = new Map<string, string>();

  const rowsRoots = interestSubCategories.filter((r) => !r.parentSlug);
  const rowsNested = interestSubCategories.filter((r) => r.parentSlug);

  for (const row of rowsRoots) {
    const category = categoryBySlug.get(row.categorySlug);
    if (!category) {
      throw new Error(`Interest category not found: ${row.categorySlug}`);
    }

    const existingRoot = await prisma.interestSubCategory.findFirst({
      where: { categoryId: category.id, parentId: null, slug: row.slug },
    });
    const created = existingRoot
      ? await prisma.interestSubCategory.update({
          where: { id: existingRoot.id },
          data: {
            name: row.name,
            suitableForAge: row.suitableForAge ?? null,
          },
        })
      : await prisma.interestSubCategory.create({
          data: {
            slug: row.slug,
            name: row.name,
            suitableForAge: row.suitableForAge ?? null,
            categoryId: category.id,
            parentId: null,
          },
        });
    rootIdByKey.set(rootIdKey(row.categorySlug, row.slug), created.id);
  }

  for (const row of rowsNested) {
    const category = categoryBySlug.get(row.categorySlug);
    if (!category) {
      throw new Error(`Interest category not found: ${row.categorySlug}`);
    }
    const parentKey = rootIdKey(row.categorySlug, row.parentSlug!);
    const parentId = rootIdByKey.get(parentKey);
    if (!parentId) {
      throw new Error(
        `Parent interest subcategory not found for nested row: ${row.categorySlug} / ${row.parentSlug} (child ${row.slug})`,
      );
    }

    await prisma.interestSubCategory.upsert({
      where: {
        categoryId_parentId_slug: {
          categoryId: category.id,
          parentId,
          slug: row.slug,
        },
      },
      update: {
        name: row.name,
        suitableForAge: row.suitableForAge ?? null,
      },
      create: {
        slug: row.slug,
        name: row.name,
        suitableForAge: row.suitableForAge ?? null,
        categoryId: category.id,
        parentId,
      },
    });
  }
}

async function main() {
  const prisma = new PrismaClient();
  try {
    console.log("Seeding interest categories...");
    await seedInterestCategories(prisma);
    const cats = await prisma.interestCategory.findMany({ orderBy: { slug: "asc" } });
    console.log(`Seeded ${cats.length} interest categories:`);
    for (const c of cats) {
      console.log(`  ${c.slug} → ${c.name}`);
    }

    console.log("\nSeeding interest subcategories...");
    await seedInterestSubCategories(prisma);
    const subs = await prisma.interestSubCategory.findMany({
      include: {
        category: { select: { slug: true, name: true } },
        parent: { select: { slug: true } },
      },
      orderBy: [
        { category: { slug: "asc" } },
        { parentId: "asc" },
        { slug: "asc" },
      ],
    });
    console.log(`Seeded ${subs.length} interest subcategories.`);
    for (const s of subs) {
      const indent = s.parent ? `    └ ` : "  ";
      const age = s.suitableForAge ? ` (${s.suitableForAge})` : "";
      const under = s.parent ? ` under ${s.parent.slug}` : "";
      console.log(`${indent}[${s.category.slug}] ${s.slug} → ${s.name}${age}${under}`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
