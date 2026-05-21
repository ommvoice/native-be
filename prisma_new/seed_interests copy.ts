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

/** Parent category slug → subcategory slug + display name (slug may repeat across parents). */
const interestSubCategories: {
  categorySlug: string;
  slug: string;
  name: string;
  age?: string;
}[] = [
  // Nature & Exploration
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
    age: "8+"
  },
  {
    categorySlug: "nature_exploration",
    slug: "coastal_adventures",
    name: "Coastal Adventures",
    age: "6+"
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
  // Movement & Energy
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
  // Creativity & Imagination
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
  // Learning & Curiosity
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
  // Slowing Down
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
  // Family Resets
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
  // Special & Memorable Days Out
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

export async function seedInterestSubCategories(prisma: PrismaClient): Promise<void> {
  for (const row of interestSubCategories) {
    const category = await prisma.interestCategory.findUnique({
      where: { slug: row.categorySlug },
    });
    if (!category) {
      throw new Error(`Interest category not found: ${row.categorySlug}`);
    }

    await prisma.interestSubCategory.upsert({
      where: {
        categoryId_slug: {
          categoryId: category.id,
          slug: row.slug,
        },
      },
      update: { name: row.name },
      create: {
        slug: row.slug,
        name: row.name,
        categoryId: category.id,
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
      include: { category: { select: { slug: true, name: true } } },
      orderBy: [{ category: { slug: "asc" } }, { slug: "asc" }],
    });
    console.log(`Seeded ${subs.length} interest subcategories.`);
    for (const s of subs) {
      console.log(`  [${s.category.slug}] ${s.slug} → ${s.name}`);
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
