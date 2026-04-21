-- AlterTable
ALTER TABLE "opportunity_events" ADD COLUMN     "abilityLevelSlug" TEXT,
ADD COLUMN     "interestTags" TEXT,
ADD COLUMN     "seasonalTagSlug" TEXT,
ADD COLUMN     "skillAreaSlug" TEXT,
ADD COLUMN     "skillAreaVariant" TEXT;

-- CreateTable
CREATE TABLE "opportunity_age_suitabilities" (
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "opportunity_age_suitabilities_pkey" PRIMARY KEY ("slug")
);

-- CreateTable
CREATE TABLE "opportunity_skill_areas" (
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "opportunity_skill_areas_pkey" PRIMARY KEY ("slug")
);

-- CreateTable
CREATE TABLE "opportunity_ability_levels" (
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "opportunity_ability_levels_pkey" PRIMARY KEY ("slug")
);

-- CreateTable
CREATE TABLE "opportunity_extra_kits" (
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "opportunity_extra_kits_pkey" PRIMARY KEY ("slug")
);

-- CreateTable
CREATE TABLE "opportunity_seasonal_tags" (
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "opportunity_seasonal_tags_pkey" PRIMARY KEY ("slug")
);

-- CreateTable
CREATE TABLE "opportunity_seasonal_highlights" (
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "opportunity_seasonal_highlights_pkey" PRIMARY KEY ("slug")
);

-- CreateTable
CREATE TABLE "opportunity_highlight_attractions" (
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "opportunity_highlight_attractions_pkey" PRIMARY KEY ("slug")
);

-- CreateTable
CREATE TABLE "_AgeSuitabilityToOpportunityEvent" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_AgeSuitabilityToOpportunityEvent_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ExtraKitToOpportunityEvent" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ExtraKitToOpportunityEvent_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_HighlightAttractionToOpportunityEvent" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_HighlightAttractionToOpportunityEvent_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_OpportunityEventToSeasonalHighlight" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_OpportunityEventToSeasonalHighlight_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "opportunity_age_suitabilities_label_key" ON "opportunity_age_suitabilities"("label");

-- CreateIndex
CREATE UNIQUE INDEX "opportunity_skill_areas_label_key" ON "opportunity_skill_areas"("label");

-- CreateIndex
CREATE UNIQUE INDEX "opportunity_ability_levels_label_key" ON "opportunity_ability_levels"("label");

-- CreateIndex
CREATE UNIQUE INDEX "opportunity_extra_kits_label_key" ON "opportunity_extra_kits"("label");

-- CreateIndex
CREATE UNIQUE INDEX "opportunity_seasonal_tags_label_key" ON "opportunity_seasonal_tags"("label");

-- CreateIndex
CREATE UNIQUE INDEX "opportunity_seasonal_highlights_label_key" ON "opportunity_seasonal_highlights"("label");

-- CreateIndex
CREATE UNIQUE INDEX "opportunity_highlight_attractions_label_key" ON "opportunity_highlight_attractions"("label");

-- CreateIndex
CREATE INDEX "_AgeSuitabilityToOpportunityEvent_B_index" ON "_AgeSuitabilityToOpportunityEvent"("B");

-- CreateIndex
CREATE INDEX "_ExtraKitToOpportunityEvent_B_index" ON "_ExtraKitToOpportunityEvent"("B");

-- CreateIndex
CREATE INDEX "_HighlightAttractionToOpportunityEvent_B_index" ON "_HighlightAttractionToOpportunityEvent"("B");

-- CreateIndex
CREATE INDEX "_OpportunityEventToSeasonalHighlight_B_index" ON "_OpportunityEventToSeasonalHighlight"("B");

-- CreateIndex
CREATE INDEX "opportunity_events_seasonalTagSlug_idx" ON "opportunity_events"("seasonalTagSlug");

-- AddForeignKey
ALTER TABLE "opportunity_events" ADD CONSTRAINT "opportunity_events_skillAreaSlug_fkey" FOREIGN KEY ("skillAreaSlug") REFERENCES "opportunity_skill_areas"("slug") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_events" ADD CONSTRAINT "opportunity_events_abilityLevelSlug_fkey" FOREIGN KEY ("abilityLevelSlug") REFERENCES "opportunity_ability_levels"("slug") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "opportunity_events" ADD CONSTRAINT "opportunity_events_seasonalTagSlug_fkey" FOREIGN KEY ("seasonalTagSlug") REFERENCES "opportunity_seasonal_tags"("slug") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AgeSuitabilityToOpportunityEvent" ADD CONSTRAINT "_AgeSuitabilityToOpportunityEvent_A_fkey" FOREIGN KEY ("A") REFERENCES "opportunity_age_suitabilities"("slug") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AgeSuitabilityToOpportunityEvent" ADD CONSTRAINT "_AgeSuitabilityToOpportunityEvent_B_fkey" FOREIGN KEY ("B") REFERENCES "opportunity_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ExtraKitToOpportunityEvent" ADD CONSTRAINT "_ExtraKitToOpportunityEvent_A_fkey" FOREIGN KEY ("A") REFERENCES "opportunity_extra_kits"("slug") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ExtraKitToOpportunityEvent" ADD CONSTRAINT "_ExtraKitToOpportunityEvent_B_fkey" FOREIGN KEY ("B") REFERENCES "opportunity_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_HighlightAttractionToOpportunityEvent" ADD CONSTRAINT "_HighlightAttractionToOpportunityEvent_A_fkey" FOREIGN KEY ("A") REFERENCES "opportunity_highlight_attractions"("slug") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_HighlightAttractionToOpportunityEvent" ADD CONSTRAINT "_HighlightAttractionToOpportunityEvent_B_fkey" FOREIGN KEY ("B") REFERENCES "opportunity_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OpportunityEventToSeasonalHighlight" ADD CONSTRAINT "_OpportunityEventToSeasonalHighlight_A_fkey" FOREIGN KEY ("A") REFERENCES "opportunity_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OpportunityEventToSeasonalHighlight" ADD CONSTRAINT "_OpportunityEventToSeasonalHighlight_B_fkey" FOREIGN KEY ("B") REFERENCES "opportunity_seasonal_highlights"("slug") ON DELETE CASCADE ON UPDATE CASCADE;
