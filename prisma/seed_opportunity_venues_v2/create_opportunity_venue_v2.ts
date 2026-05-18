import type { Prisma, PrismaClient } from "@prisma/client";

/**
 * Same shape as `OpportunityVenuesV2UncheckedCreateInput`, but theme links are
 * expressed as catalog slugs (`themeSlug` + `themeVariantSlug`) instead of UUIDs.
 */
export type OpportunityVenueV2SeedInput = Omit<
  Prisma.OpportunityVenuesV2UncheckedCreateInput,
  "themeId" | "themeVariantId"
> & {
  themeSlug: string;
  themeVariantSlug: string;
};

export async function createOpportunityVenueV2Seed(
  prisma: PrismaClient,
  input: OpportunityVenueV2SeedInput,
) {
  const { themeSlug, themeVariantSlug, ...scalars } = input;

  const recordType = "venue" as const;

  const theme = await prisma.opportunityTheme.findFirst({
    where: { recordType, slug: themeSlug.trim() },
  });
  if (!theme) {
    throw new Error(
      `Opportunity theme not found for recordType=${recordType}, slug=${themeSlug}`,
    );
  }

  const themeVariant = await prisma.opportunityThemeVariant.findFirst({
    where: {
      themeId: theme.id,
      slug: themeVariantSlug.trim(),
    },
  });
  if (!themeVariant) {
    throw new Error(
      `Opportunity theme variant not found for themeId=${theme.id}, slug=${themeVariantSlug}`,
    );
  }

  return prisma.opportunityVenuesV2.create({
    data: {
      ...scalars,
      themeId: theme.id,
      themeVariantId: themeVariant.id,
    },
  });
}
