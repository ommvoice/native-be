import type {
  OpportunityRecordType,
  Prisma,
  PrismaClient,
} from "@prisma/client";

export type OpportunityClubV2SeedInput = Omit<
  Prisma.OpportunityClubV2UncheckedCreateInput,
  "themeId" | "themeVariantId"
> & {
  themeSlug: string;
  themeVariantSlug: string;
};

export async function createOpportunityClubV2Row(
  prisma: PrismaClient,
  input: OpportunityClubV2SeedInput,
) {
  const {
    themeSlug,
    themeVariantSlug,
    opportunityType: inputRecordType,
    ...scalars
  } = input;

  const opportunityType = (inputRecordType ?? "club") as OpportunityRecordType;

  const theme = await prisma.opportunityTheme.findFirst({
    where: { recordType: opportunityType, slug: themeSlug.trim() },
  });
  if (!theme) {
    throw new Error(
      `Opportunity theme not found for recordType=${opportunityType}, slug=${themeSlug}`,
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

  return prisma.opportunityClubV2.create({
    data: {
      ...scalars,
      opportunityType,
      themeId: theme.id,
      themeVariantId: themeVariant.id,
    },
  });
}
